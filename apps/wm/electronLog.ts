// Loggin based on: https://github.com/ungoldman/electron-ipc-log/blob/master/index.js

const electron = require("electron");

const internal = ["CHROME", "ELECTRON"];

interface IElectronEvent {
  channel: string | symbol;
  data: readonly unknown[];
  sync?: boolean;
  sent?: boolean;
}

interface Logger {
  (event: IElectronEvent): void;
}

export function electronIpcLog(log: Logger) {
  if (log == null) log = console.log;
  //if (electron.ipcRenderer) return handleRenderer(log);
  if (electron.ipcMain) return handleMain(log);
}

// function handleRenderer(log: Logger): void {
//   const { ipcRenderer } = electron;
//   const oldEmit = ipcRenderer.emit;
//   const oldSend = ipcRenderer.send;
//   const oldSendSync = ipcRenderer.sendSync;

//   ipcRenderer.emit = function (channel, event, ...data) {
//     trackEvent(log, channel, data);
//     return oldEmit.apply(ipcRenderer, arguments);
//   };

//   ipcRenderer.send = function (channel, ...data) {
//     trackEvent(log, channel, data, true);
//     return oldSend.apply(ipcRenderer, arguments);
//   };

//   ipcRenderer.sendSync = function (channel, ...data) {
//     trackEvent(log, channel, data, true, true);
//     const returnValue = oldSendSync.apply(ipcRenderer, arguments);
//     trackEvent(log, channel, [returnValue], false, true);
//     return returnValue;
//   };
// }

function handleMain(log: Logger) {
  const { ipcMain } = electron;
  const oldEmit = ipcMain.emit;

  ipcMain.emit = function (channel, event, ...data) {
    trackEvent(log, channel, data);
    return oldEmit.apply(ipcMain, [channel, event, ...data]);
  };
}

function trackEvent(log: Logger, channel: string | symbol, data: unknown[], sent?: boolean, sync?: boolean): void {
  // only log user defined ipc messages
  const isInteral = internal.some((str) => {
    if (typeof channel === "string") {
      return channel.indexOf(str) !== -1;
    }
    return true;
  });
  if (isInteral) return;

  const event: IElectronEvent = { channel, data };

  if (sent) event.sent = sent;
  if (sync) event.sync = sync;

  log(event);
}
