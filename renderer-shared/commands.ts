import { ipcRenderer } from "electron";

export function raiseWindow(wid: number) {
    ipcRenderer.send("raise-window", wid);
}

export function minimizeWindow(wid: number) {
    ipcRenderer.send("minimize-window", wid);
}

export function closeWindow(wid: number) {
    ipcRenderer.send("close-window", wid);
}

export function exec(executable: string, args?: string) {
    ipcRenderer.send("exec", { executable, args });
};

export function showDevTools(screenIndex: number): void {
    ipcRenderer.send("show-desktop-dev-tools", { screenIndex });
};
