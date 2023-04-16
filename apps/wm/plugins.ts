import { app } from "electron";
import { PluginInstance, PluginSpecifiers } from "@electron-wm/shared";
import { isAbsolute } from "path";
import { installPackage } from "./npmPackageCache";

const InstallDirectory = app.getAppPath();

/** Resolves plugins into their runtime types. */
export async function resolvePluginsForWM<T extends PluginInstance<unknown>>(
  specifiers: PluginSpecifiers
): Promise<T[]> {
  const specifiersArr = Array.isArray(specifiers) ? specifiers : [specifiers];

  const plugins: T[] = [];
  for (const specifier of specifiersArr) {
    const moduleId = typeof specifier === "string" ? specifier : specifier.id;
    let loadedModule: unknown;
    if (isAbsolute(moduleId)) {
      loadedModule = require(moduleId);
    } else {
      const installPath = await installPackage(moduleId, InstallDirectory);
      loadedModule = require(installPath);
    }

    if (loadedModule) {
      plugins.push({
        exports: loadedModule,
        settings: typeof specifier === "object" ? specifier.settings : undefined,
      } as T);
    }
  }
  return plugins;
}
