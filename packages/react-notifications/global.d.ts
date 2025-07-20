// Declarações para window.electron
declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        on: (channel: string, callback: (...args: any[]) => void) => void;
        send: (channel: string, ...args: any[]) => void;
        removeAllListeners: (channel: string) => void;
      };
    };
  }
}

export {};
