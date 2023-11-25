import { isAbsolute } from "path";
import { requirePackage } from "./npmPackageProxy";
import { PluginInstance } from "./plugins";

export interface PluginSpecifierObject {
  id: string;
  settings?: object;
}

export type PluginSpecifiers = string | PluginSpecifierObject | readonly (string | PluginSpecifierObject)[];

export interface IPluginConfig {
  frame?: PluginSpecifiers;
  layout?: PluginSpecifiers;
  taskbar?: PluginSpecifiers;
  wallpaper?: PluginSpecifiers;
}

type ScreenOverridesDict = { [screenIndex: number]: Partial<IConfig> };

type ObjectConfigPropertyType = IPluginConfig | ScreenOverridesDict;

export interface IConfig {
  initialLayout: string;
  initialTag: string;
  tags: string[];
  term: string;
  plugins?: IPluginConfig;
  screenOverrides?: ScreenOverridesDict;
  version?: string;
}

export const defaultConfig: IConfig = {
  initialLayout: "Floating",
  initialTag: "1",
  tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  term: "xterm",
  plugins: {},
  screenOverrides: {},
};

export function assignConfig(dest: IConfig, src: Partial<IConfig>): void {
  for (const configPropName in src) {
    switch (configPropName) {
      case "plugins":
      case "screenOverrides":
        {
          // Overwrite at the level of each subkey, not the entire object.

          // Clone the subobject, since sometimes the target is readonly.
          let subobject = dest[configPropName as keyof IConfig] as ObjectConfigPropertyType;
          subobject = subobject ? { ...subobject } : {};

          Object.assign(
            subobject,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            src[configPropName as keyof Partial<IConfig>] as any
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dest[configPropName as keyof IConfig] = subobject as any;
        }
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dest[configPropName as keyof IConfig] = src[configPropName as keyof Partial<IConfig>] as any;
        break;
    }
  }
}

/** Resolves plugins into their runtime types. */
export async function resolvePlugins<T extends PluginInstance<unknown>>(
  specifiers: PluginSpecifiers,
  installDirectory: string
): Promise<T[]> {
  const specifiersArr = Array.isArray(specifiers) ? specifiers : [specifiers];

  const plugins: T[] = [];
  for (const specifier of specifiersArr) {
    const moduleId = typeof specifier === "string" ? specifier : specifier.id;
    let loadedModule: unknown;
    if (isAbsolute(moduleId)) {
      loadedModule = require(moduleId);
    } else {
      loadedModule = await requirePackage<T>(moduleId, installDirectory);
    }

    if (typeof loadedModule === "object") {
      plugins.push({
        exports: loadedModule,
        settings: typeof specifier === "object" ? specifier.settings : undefined,
      } as T);
    }
  }
  return plugins;
}
