import { ipcMain } from "electron";
import { execCommand } from "./exec";

export function setupAutocompleteListener(): void {
  ipcMain.on("completion-options-get", (event) => {
    getCompletionOptions().then((options) => {
      event.sender.send("completion-options-result", options);
    });
  });
}

function getCompletionOptions(): Promise<string[]> {
  return new Promise((resolve) => {
    try {
      execCommand("/usr/bin/env bash -c 'compgen -c'", (commands) => {
        resolve(
          commands
            .split("\n")
            .map((c) => c.trim())
            .filter((c) => !!c)
        );
      });
    } catch {
      resolve([]);
    }
  });
}
