#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import dbus
import dbus.service
import dbus.mainloop.glib
from gi.repository import GLib
import json
import sys
import signal
import threading
import time
from datetime import datetime

class NotificationServer(dbus.service.Object):
    def __init__(self):
        self.notification_id = 1
        self.active_notifications = {}
        self.running = True
        
        # Configura o loop principal do D-Bus
        dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
        
        # Conecta ao session bus
        self.session_bus = dbus.SessionBus()
        
        # Registra o nome do serviço
        bus_name = dbus.service.BusName('org.freedesktop.Notifications', self.session_bus)
        
        # Inicializa o objeto D-Bus
        super().__init__(bus_name, '/org/freedesktop/Notifications')

    @dbus.service.method('org.freedesktop.Notifications',
                        in_signature='susssasa{sv}i', out_signature='u')
    def Notify(self, app_name, replaces_id, app_icon, summary, body, actions, hints, expire_timeout):
        """Método principal que recebe todas as notificações do sistema"""
        
        timestamp = int(datetime.now().timestamp() * 1000)
        notification_id = replaces_id if replaces_id > 0 else self.notification_id
        if replaces_id == 0:
            self.notification_id += 1
        
        # Armazena a notificação
        self.active_notifications[notification_id] = {
            'app_name': str(app_name),
            'summary': str(summary),
            'body': str(body),
            'timestamp': timestamp
        }
        
        # Prepara dados da notificação
        notification_data = {
            'id': notification_id,
            'app_name': str(app_name),
            'summary': str(summary),
            'body': str(body),
            'app_icon': str(app_icon) if app_icon else '',
            'actions': list(actions),
            'hints': dict(hints) if hints else {},
            'expire_timeout': int(expire_timeout),
            'timestamp': timestamp
        }
        
        # Envia para o Bond WM
        try:
            print("BONDWM_NOTIFICATION:" + json.dumps({
                'type': 'notification_new',
                'notification': notification_data
            }), flush=True)
        except Exception:
            pass
        
        return notification_id

    @dbus.service.method('org.freedesktop.Notifications',
                        in_signature='', out_signature='as')
    def GetCapabilities(self):
        """Retorna as capacidades do servidor"""
        return [
            'action-icons',
            'actions', 
            'body',
            'body-hyperlinks',
            'body-markup',
            'icon-multi',
            'icon-static',
            'persistence',
            'sound'
        ]

    @dbus.service.method('org.freedesktop.Notifications',
                        in_signature='', out_signature='ssss')
    def GetServerInformation(self):
        """Retorna informações do servidor"""
        return ('Bond WM Notifications', 'Bond Window Manager', '0.6.1', '1.2')

    @dbus.service.method('org.freedesktop.Notifications',
                        in_signature='u', out_signature='')
    def CloseNotification(self, notification_id):
        """Fecha uma notificação"""
        if notification_id in self.active_notifications:
            del self.active_notifications[notification_id]
            
            # Envia evento de fechamento para o Bond WM
            try:
                print("BONDWM_NOTIFICATION:" + json.dumps({
                    'type': 'notification_close',
                    'id': notification_id
                }), flush=True)
            except Exception:
                pass
            
            # Emite sinal D-Bus de fechamento
            self.NotificationClosed(notification_id, 3)  # 3 = closed by call

    @dbus.service.signal('org.freedesktop.Notifications', signature='uu')
    def NotificationClosed(self, notification_id, reason):
        """Sinal emitido quando uma notificação é fechada"""
        pass

    @dbus.service.signal('org.freedesktop.Notifications', signature='us')
    def ActionInvoked(self, notification_id, action_key):
        """Sinal emitido quando uma ação é invocada"""
        pass

    def stop(self):
        self.running = False

def signal_handler(server, loop):
    def handler(signum, frame):
        try:
            print("BONDWM_NOTIFICATION:" + json.dumps({
                'type': 'shutdown',
                'message': 'Servidor encerrado'
            }), flush=True)
        except Exception:
            pass
        server.stop()
        loop.quit()
    return handler

def read_stdin_commands(server):
    """Thread para ler comandos do stdin"""
    try:
        while server.running:
            try:
                line = sys.stdin.readline()
                if not line:
                    # EOF - stdin foi fechado
                    break
                
                line = line.strip()
                if not line:
                    continue
                
                try:
                    command = json.loads(line)
                    command_type = command.get('type')
                    
                    if command_type == 'action_invoked':
                        notification_id = command.get('id')
                        action_key = command.get('action')
                        
                        print("BONDWM_NOTIFICATION:" + json.dumps({
                            'type': 'action_processing',
                            'id': notification_id,
                            'action': action_key,
                            'message': f'Processing action {action_key} for notification {notification_id}'
                        }), flush=True)
                        
                        # Emite o sinal D-Bus ActionInvoked
                        try:
                            server.ActionInvoked(notification_id, action_key)
                            print("BONDWM_NOTIFICATION:" + json.dumps({
                                'type': 'action_sent',
                                'id': notification_id,
                                'action': action_key,
                                'message': f'ActionInvoked signal sent for notification {notification_id}, action {action_key}'
                            }), flush=True)
                        except Exception as e:
                            print("BONDWM_NOTIFICATION:" + json.dumps({
                                'type': 'action_error',
                                'id': notification_id,
                                'action': action_key,
                                'error': str(e),
                                'message': f'Failed to send ActionInvoked signal: {str(e)}'
                            }), flush=True)
                    
                except json.JSONDecodeError as e:
                    print("BONDWM_NOTIFICATION:" + json.dumps({
                        'type': 'command_error',
                        'error': f'Invalid JSON: {str(e)}',
                        'input': line
                    }), flush=True)
                    
            except Exception as e:
                if server.running:
                    print("BONDWM_NOTIFICATION:" + json.dumps({
                        'type': 'stdin_error',
                        'error': str(e)
                    }), flush=True)
                break
                
    except Exception as e:
        if server.running:
            print("BONDWM_NOTIFICATION:" + json.dumps({
                'type': 'stdin_thread_error',
                'error': str(e)
            }), flush=True)

def main():
    try:
        # Cria o servidor
        server = NotificationServer()
        
        # Cria o loop principal
        loop = GLib.MainLoop()
        
        # Configura handlers de sinal
        handler = signal_handler(server, loop)
        signal.signal(signal.SIGTERM, handler)
        signal.signal(signal.SIGINT, handler)
        
        # Inicia thread para ler comandos do stdin
        stdin_thread = threading.Thread(target=read_stdin_commands, args=(server,), daemon=True)
        stdin_thread.start()
        
        # Envia confirmação de que está pronto
        print("BONDWM_NOTIFICATION:" + json.dumps({
            'type': 'server_ready',
            'message': 'Bond WM Notification Server iniciado com stdin reader'
        }), flush=True)
        
        # Executa o loop de forma robusta
        def run_loop():
            try:
                loop.run()
            except Exception:
                pass
        
        # Inicia o loop em thread separada para evitar travamento
        loop_thread = threading.Thread(target=run_loop, daemon=True)
        loop_thread.start()
        
        # Loop principal simples para manter o processo vivo
        while server.running:
            time.sleep(0.1)
            
    except Exception as e:
        try:
            print("BONDWM_NOTIFICATION:" + json.dumps({
                'type': 'error',
                'message': str(e)
            }), flush=True)
        except Exception:
            pass
    finally:
        sys.exit(0)

if __name__ == '__main__':
    main()
