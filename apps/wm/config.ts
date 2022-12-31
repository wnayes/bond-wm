import { env } from "process";
import { existsSync } from "fs";
import { join } from "path";
import { app } from "electron";
import { log, logError } from "./log";
import { setConfigAction } from "@electron-wm/shared";
import { ServerStore } from "./configureStore";
import { IConfig } from "@electron-wm/shared";

let _store: ServerStore;

export function getConfig(): IConfig {
  return _store.getState().config;
}

export async function loadConfigFromDisk(store: ServerStore): Promise<void> {
  _store = store;

  let XDG_CONFIG_HOME = env["XDG_CONFIG_HOME"];
  if (!XDG_CONFIG_HOME) {
    const HOME = env["HOME"] || "~";
    XDG_CONFIG_HOME = join(HOME, ".config");
  }
  log("XDG_CONFIG_HOME", XDG_CONFIG_HOME);

  // Later paths take precedence.
  const configPaths = [
    // The file distributed with the app itself.
    join(app.getAppPath(), ".ewmrc.js"),

    // Support this once TypeScript emits import() correctly in Node.
    // join(XDG_CONFIG_HOME, "electron-wm-config/.ewmrc.mjs"),

    join(XDG_CONFIG_HOME, "electron-wm-config/.ewmrc.js"),
  ];
  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      log("Reading user config file", configPath);

      try {
        const userConfigModule = await import(configPath);
        if (userConfigModule) {
          processConfigModule(userConfigModule);
        }
      } catch (e) {
        logError("Error reading user config file", e);
      }
    }
  }

  log("Initial config", getConfig());
}

interface IConfigModule {
  config?: Partial<IConfig>;
}

function processConfigModule(userConfigModule: IConfigModule): void {
  const config = userConfigModule.config;
  if (typeof config === "object") {
    log("Config from module", config);
    _store.dispatch(setConfigAction(config));
  }
}
