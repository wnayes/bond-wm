import * as fs from "fs";
import * as util from "util";

const logFile = fs.createWriteStream(`/tmp/electron-wm-${new Date()}.txt`, { flags: "w" });
const stdout = process.stdout;
const stderr = process.stderr;

export function log(...args: unknown[]): void {
  const logText = formatLogText(args);
  logFile.write(logText);
  stdout.write(logText);
}

export function logDir(obj: unknown, options: object): void {
  const logText = util.inspect(obj, { showHidden: false, depth: 3, colors: false, ...options }) + "\n";
  logFile.write(logText);
  stdout.write(logText);
}

export function logError(...args: unknown[]): void {
  const logText = formatLogText(args);
  logFile.write(logText);
  stderr.write(logText);
}

function formatLogText(args: unknown[]) {
  return util.format.apply(null, args) + "\n";
}
