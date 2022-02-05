import * as fs from "fs";
import * as util from "util";
import { getArgs } from "./args";

const { consoleLogging, fileLogging } = getArgs();

const logFile = fileLogging ? fs.createWriteStream(fileLogging, { flags: "w" }) : null;

const stdout = process.stdout;
const stderr = process.stderr;

export function log(...args: unknown[]): void {
  if (logFile || consoleLogging) {
    const logText = formatLogText(args);
    logFile?.write(logText);
    if (consoleLogging) {
      stdout.write(logText);
    }
  }
}

export function logDir(obj: unknown, options: object): void {
  if (logFile || consoleLogging) {
    const logText = util.inspect(obj, { showHidden: false, depth: 3, colors: false, ...options }) + "\n";
    logFile?.write(logText);
    if (consoleLogging) {
      stdout.write(logText);
    }
  }
}

export function logTrace(message: string): void {
  if (logFile || consoleLogging) {
    const logText = formatLogText([message, new Error().stack]);
    logFile?.write(logText);
    if (consoleLogging) {
      stdout.write(logText);
    }
  }
}

export function logError(...args: unknown[]): void {
  if (logFile || consoleLogging) {
    const logText = formatLogText(args);
    logFile?.write(logText);
    if (consoleLogging) {
      stderr.write(logText);
    }
  }
}

function formatLogText(args: unknown[]) {
  return util.format.apply(null, args) + "\n";
}
