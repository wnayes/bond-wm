import { LayoutPluginConfig } from "./layouts";

/** Expect module contents for a "desktop" module. */
export interface DesktopModule {
  /** Returns the source path to use for the desktop window. */
  getDesktopWindowSrc(): string;
}

/** Expect module contents for a "frame" module. */
export interface FrameModule {
  /** Returns the source path to use for the frame window. */
  getFrameWindowSrc(): string;
}

type ScreenOverridesDict = { [screenIndex: number]: Partial<IConfig> };

type ObjectConfigPropertyType = ScreenOverridesDict;

export interface IConfig {
  initialLayout: string;
  initialTag: string;
  tags: string[];
  term: string;
  desktop: {
    module: DesktopModule;
    settings?: unknown;
  };
  frame: {
    module: FrameModule;
    settings?: unknown;
  };
  layouts: readonly LayoutPluginConfig[];
  screenOverrides?: ScreenOverridesDict;
  version?: string;
}

export const defaultConfig: IConfig = {
  initialLayout: "Floating",
  initialTag: "1",
  tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  term: "xterm",
  desktop: {
    module: {
      getDesktopWindowSrc: () => {
        throw new Error("No desktop module specified.");
      },
    },
  },
  frame: {
    module: {
      getFrameWindowSrc: () => {
        throw new Error("No frame module specified.");
      },
    },
  },
  layouts: [],
  screenOverrides: {},
};

// https://github.com/TypeStrong/ts-node/discussions/1290
//const dynamicImport = new Function("specifier", "return import(specifier)");

let _config: IConfig | null = null;
let _configPath: string | null = null;

export function setConfigPath(configPath: string): void {
  _configPath = configPath;
}

export async function getConfigAsync(): Promise<IConfig> {
  if (!_config) {
    if (!_configPath) {
      throw new Error("Config path was not determined.");
    }
    _config = (await import(_configPath)).default;
  }
  return _config!;
}

export function getConfigWithOverrides(screenIndex: number): IConfig {
  if (!_config) {
    throw new Error("Missing config");
  }
  const config = { ..._config };
  const overrides = config.screenOverrides?.[screenIndex];
  if (overrides) {
    assignConfig(config, overrides);
  }
  return config;
}

export function assignConfig(dest: IConfig, src: Partial<IConfig>): void {
  for (const configPropName in src) {
    switch (configPropName) {
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
