import { env } from "process";
import { existsSync } from "fs";
import { log, logError } from "./log";
import { IConfig, setConfigAction } from "../shared/redux/configSlice";
import { ServerStore } from "./configureStore";

let _store: ServerStore;

export function getConfig(): IConfig {
  return _store.getState().config;
}

export async function loadConfigFromDisk(store: ServerStore): Promise<void> {
  _store = store;

  let XDG_CONFIG_HOME = env["XDG_CONFIG_HOME"];
  if (!XDG_CONFIG_HOME) {
    const HOME = env["HOME"];
    XDG_CONFIG_HOME = HOME + "/.config";
  }
  log("XDG_CONFIG_HOME", XDG_CONFIG_HOME);

  const configPaths = [
    // Support this once TypeScript emits import() correctly in Node.
    // XDG_CONFIG_HOME + "/electron-wm-config/.ewmrc.mjs",
    XDG_CONFIG_HOME + "/electron-wm-config/.ewmrc.js",
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

  log("Initial config", getConfig());
}

interface IConfigModule {
  config?: IConfig;
}

function processConfigModule(userConfigModule: IConfigModule): void {
  if (typeof userConfigModule.config === "object") {
    _store.dispatch(setConfigAction(userConfigModule.config));
  }
}
