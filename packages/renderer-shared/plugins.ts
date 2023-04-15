import { PluginInstance, PluginSpecifiers, resolvePlugins } from "@electron-wm/shared";

let _pluginInstallDirectory: string | undefined;

export function getPluginInstallDirectory(): string {
  if (!_pluginInstallDirectory) {
    throw new Error("Expected plugin install directory to be set.");
  }
  return _pluginInstallDirectory;
}

export function setPluginInstallDirectory(path: string): void {
  _pluginInstallDirectory = path;
}

/**
 * Resolves plugins into their runtime types.
 * This particular API is used by renderers.
 */
export function resolvePluginsFromRenderer<T extends PluginInstance<unknown>>(
  specifiers: PluginSpecifiers
): Promise<T[]> {
  return resolvePlugins<T>(specifiers, getPluginInstallDirectory());
}
