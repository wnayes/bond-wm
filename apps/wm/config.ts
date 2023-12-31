import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { app } from "electron";
import { log, logError } from "./log";
import { getConfigAsync, setConfigPath, setConfigPathAction, setVersionAction } from "@electron-wm/shared";
import { ServerStore } from "./configureStore";
import { getArgs } from "./args";
import { getXDGConfigHome } from "./xdg";

export async function loadConfigFromDisk(store: ServerStore): Promise<void> {
  readVersionInfo(store);

  let configPath: string | undefined = getArgs().config;
  if (configPath) {
    if (configPath.startsWith(".")) {
      configPath = resolve(configPath);
    }
    if (!existsSync(configPath)) {
      logError(`The --config path ${configPath} failed to resolve or does not exist.`);
    }
  } else {
    const XDG_CONFIG_HOME = getXDGConfigHome();
    log("XDG_CONFIG_HOME", XDG_CONFIG_HOME);

    configPath = join(XDG_CONFIG_HOME, "electron-wm-config", "index.ts");
    if (!existsSync(configPath)) {
      logError("No --config path was specified, and no default config locations existed.");
      return;
    }
  }

  setConfigPath(configPath);
  store.dispatch(setConfigPathAction(configPath));

  const config = await getConfigAsync();
  log("Initial config", config);
}

interface VersionJson {
  version: string;
}

function readVersionInfo(store: ServerStore): void {
  const versionJsonPath = join(app.getAppPath(), "dist", "version.json");
  if (!existsSync(versionJsonPath)) {
    logError(`version.json missing at '${versionJsonPath}'`);
    return;
  }

  const versionJson: VersionJson = JSON.parse(readFileSync(versionJsonPath, "utf-8"));

  store.dispatch(setVersionAction(versionJson.version));
}
