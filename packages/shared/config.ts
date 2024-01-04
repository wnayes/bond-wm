import { LayoutInfo, LayoutPluginConfig, cloneLayoutInfo } from "./layouts";
import { IWindowManagerServer } from "./server";

/** Expect module contents for a "desktop" module. */
export interface DesktopModule {
  /** Returns the source path to use for the desktop window. */
  getDesktopWindowSrc(screenIndex: number): string;
}

/** Expect module contents for a "frame" module. */
export interface FrameModule {
  /** Returns the source path to use for the frame window. */
  getFrameWindowSrc(): string;
}

type ScreenOverridesDict<TConfig> = { [screenIndex: number]: Partial<TConfig> };

type ObjectConfigPropertyType = ScreenOverridesDict<ISerializableConfig<LayoutInfo>>;

interface WindowManagerReadyArgs {
  wm: IWindowManagerServer;
}

export interface ISerializableConfig<TLayouts extends LayoutInfo> {
  initialLayout: string;
  initialTag: string;
  tags: string[];
  layouts: TLayouts[];
  screenOverrides?: ScreenOverridesDict<this>;
}

/** Window manager configuration. */
export interface IConfig extends ISerializableConfig<LayoutPluginConfig> {
  onWindowManagerReady?: (args: WindowManagerReadyArgs) => Promise<void> | void;
}

export interface IDesktopConfig {
  module: DesktopModule;
  settings?: unknown;
}

export interface IFrameConfig {
  module: FrameModule;
  settings?: unknown;
}

export const defaultConfig: IConfig = {
  initialLayout: "Floating",
  initialTag: "1",
  tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  layouts: [],
  screenOverrides: {},
};

// https://github.com/TypeStrong/ts-node/discussions/1290
//const dynamicImport = new Function("specifier", "return import(specifier)");

let _config: IConfig | null = null;
let _configFrame: IFrameConfig | null = null;
let _configPath: string | null = null;

export function setConfigPath(configPath: string): void {
  _configPath = configPath;
}

export function getConfigPath(subpath?: string): string {
  if (!_configPath) {
    throw new Error("Config path not available yet.");
  }
  if (subpath) {
    return _configPath + "/" + subpath;
  }
  return _configPath;
}

export function setConfig(config: IConfig): void {
  _config = config;
}

export function getConfig(): IConfig {
  return _config!;
}

export function getConfigAsync(): Promise<IConfig> {
  return Promise.resolve(_config!);
}

export async function getFrameConfigAsync(): Promise<IFrameConfig> {
  if (!_configFrame) {
    if (!_configPath) {
      throw new Error("Config path was not determined.");
    }
    _configFrame = (await import(_configPath + "/frame")).default;
  }
  return _configFrame!;
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

export function cloneConfig(config: ISerializableConfig<LayoutInfo>): ISerializableConfig<LayoutInfo> {
  let overrides: { [screenIndex: number]: Partial<ISerializableConfig<LayoutInfo>> } | undefined;
  if (config.screenOverrides) {
    overrides = {};
    for (const screenIndex in config.screenOverrides) {
      const overrideForScreen = config.screenOverrides[screenIndex];
      overrides[screenIndex] = { ...overrideForScreen, layouts: overrideForScreen.layouts?.map(cloneLayoutInfo) };
    }
  }
  return {
    initialLayout: config.initialLayout,
    initialTag: config.initialTag,
    tags: config.tags,
    layouts: config.layouts.map(cloneLayoutInfo),
    screenOverrides: overrides,
  };
}

export function assignConfig<TConfig extends ISerializableConfig<LayoutInfo>>(
  dest: TConfig,
  src: Partial<TConfig>
): void {
  for (const configPropName in src) {
    switch (configPropName) {
      case "screenOverrides":
        {
          // Overwrite at the level of each subkey, not the entire object.

          // Clone the subobject, since sometimes the target is readonly.
          let subobject = dest[configPropName as keyof ISerializableConfig<LayoutInfo>] as ObjectConfigPropertyType;
          subobject = subobject ? { ...subobject } : {};

          Object.assign(
            subobject,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            src[configPropName as keyof Partial<ISerializableConfig<LayoutInfo>>] as any
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dest[configPropName as keyof ISerializableConfig<LayoutInfo>] = subobject as any;
        }
        break;
      default:
        dest[configPropName as keyof ISerializableConfig<LayoutInfo>] = src[
          configPropName as keyof Partial<ISerializableConfig<LayoutInfo>>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any;
        break;
    }
  }
}
