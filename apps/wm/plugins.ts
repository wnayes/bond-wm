import { app } from "electron";
import { PluginSpecifiers } from "@electron-wm/shared";
import { isAbsolute } from "path";
import { installPackage } from "./npmPackageCache";

const InstallDirectory = app.getAppPath();

/** Resolves plugins into their runtime types. */
export async function resolvePluginsForWM<T>(specifiers: PluginSpecifiers): Promise<T[]> {
  if (typeof specifiers === "string") {
    specifiers = [specifiers];
  }

  const plugins: T[] = [];
  for (const specifier of specifiers) {
    let loadedModule: T;
    if (isAbsolute(specifier)) {
      loadedModule = require(specifier);
    } else {
      const installPath = await installPackage(specifier, InstallDirectory);
      loadedModule = require(installPath);
    }

    if (loadedModule != null) {
      plugins.push(loadedModule);
    }
  }
  return plugins;
}
