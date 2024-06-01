import { existsSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { log } from "./log";
import { setConfigPath, setConfigPathAction } from "@bond-wm/shared";
import { ServerStore } from "./configureStore";
import { getArgs } from "./args";
import { getXDGConfigHome } from "./xdg";

export async function determineConfigPath(store: ServerStore): Promise<string> {
  let configPath: string | undefined = getArgs().config;
  if (configPath) {
    if (configPath.startsWith(".")) {
      configPath = resolve(configPath);
    } else if (!configPath.startsWith(sep)) {
      configPath = dirname(require.resolve(`${configPath}/package.json`));
    }
    if (!existsSync(configPath)) {
      throw new Error(`The --config path ${configPath} failed to resolve or does not exist.`);
    }
  } else {
    const XDG_CONFIG_HOME = getXDGConfigHome();
    log("XDG_CONFIG_HOME", XDG_CONFIG_HOME);

    configPath = join(XDG_CONFIG_HOME, "bond-wm-config");
    if (!existsSync(configPath)) {
      throw new Error("No --config path was specified, and no default config locations existed.");
    }
  }

  setConfigPath(configPath);
  store.dispatch(setConfigPathAction(configPath));
  return configPath;
}
