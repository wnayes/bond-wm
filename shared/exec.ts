import { exec } from "child_process";

export function execCommand(command: string, callback: (output: string) => void) {
  exec(command, (_error, stdout) => {
    callback(stdout);
  });
}
