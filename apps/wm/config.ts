import { env } from "process";
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve as pathResolve } from "path";
import { app } from "electron";
import { log, logError } from "./log";
import { IPluginConfig, setConfigAction } from "@electron-wm/shared";
import { ServerStore } from "./configureStore";
import { IConfig } from "@electron-wm/shared";

let _store: ServerStore;

export function getConfig(): IConfig {
  return _store.getState().config;
}

export async function loadConfigFromDisk(store: ServerStore): Promise<void> {
  _store = store;

  readVersionInfo(store);

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
          const configDirectory = dirname(configPath);
          processConfigModule(userConfigModule, configDirectory);
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

function processConfigModule(userConfigModule: IConfigModule, configDirectory: string): void {
  const config = userConfigModule.config;
  if (typeof config === "object") {
    log("Config from module", config);

    if (config.plugins) {
      // Resolve plugin specifiers, which may be relative to this specific config.
      for (const pluginType in config.plugins) {
        const pluginSpecifier = config.plugins[pluginType as keyof IPluginConfig];
        if (typeof pluginSpecifier === "string") {
          config.plugins[pluginType as keyof IPluginConfig] = mapPluginSpecifier(pluginSpecifier, configDirectory);
        } else if (Array.isArray(pluginSpecifier)) {
          config.plugins[pluginType as keyof IPluginConfig] = pluginSpecifier.map((specifier) =>
            mapPluginSpecifier(specifier, configDirectory)
          );
        } else {
          logError("Unexpected plugin specifier type: " + typeof pluginSpecifier);
        }
      }

      log("Config from module (post path resolution)", config);
    }

    _store.dispatch(setConfigAction(config));
  }
}

function mapPluginSpecifier(specifier: string, configPath: string): string {
  if (specifier.startsWith(".")) {
    return pathResolve(configPath, specifier);
  }
  return specifier;
}

interface VersionJson {
  version: string;
}

function readVersionInfo(store: ServerStore): void {
  const versionJsonPath = join(app.getAppPath(), "apps", "wm", "dist", "version.json");
  if (!existsSync(versionJsonPath)) {
    logError(`version.json missing at '${versionJsonPath}'`);
    return;
  }

  const versionJson: VersionJson = JSON.parse(readFileSync(versionJsonPath, "utf-8"));

  store.dispatch(
    setConfigAction({
      version: versionJson.version,
    })
  );
}
