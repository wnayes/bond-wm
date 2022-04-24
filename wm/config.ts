import { env } from "process";
import { existsSync } from "fs";
import { log, logError } from "./log";

interface IConfig {
  term: string;
}

const _config: IConfig = {
  term: "xterm",
};

export function getConfig() {
  return _config;
}

export async function loadConfigFromDisk(): Promise<void> {
  let XDG_CONFIG_HOME = env["XDG_CONFIG_HOME"];
  if (!XDG_CONFIG_HOME) {
    const HOME = env["HOME"];
    XDG_CONFIG_HOME = HOME + "/.config";
  }
  log("XDG_CONFIG_HOME", XDG_CONFIG_HOME);

  const configPaths = [
    // Support this once TypeScript emits import() correctly.
    // XDG_CONFIG_HOME + "/.ewmrc.mjs",
    XDG_CONFIG_HOME + "/.ewmrc.js",
  ];
  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      log("Reading user config file", configPath);

      try {
        const userConfigModule = await import(configPath);
        if (userConfigModule) {
          processConfigModule(userConfigModule);
          break;
        }
      } catch (e) {
        logError("Error reading user config file", e);
      }
    }
  }

  log("Initial config", _config);
}

interface IConfigModule {
  TERM?: string;
}

function processConfigModule(userConfigModule: IConfigModule): void {
  if (typeof userConfigModule.TERM === "string") {
    _config.term = userConfigModule.TERM;
  }
}
