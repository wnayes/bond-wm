import { isAbsolute } from "path";
import { FunctionComponent } from "react";

type PluginSpecifiers = string | string[];

export interface IPluginConfig {
  wallpaper: PluginSpecifiers;
}

/** Expected wallpaper plugin module exports. */
export interface WallpaperModule {
  /** Wallpaper React function component. */
  default: FunctionComponent;
}

export interface IConfig {
  initialLayout: string;
  initialTag: string;
  tags: string[];
  term: string;
  plugins?: IPluginConfig;
  version?: string;
}

export const defaultConfig: IConfig = {
  initialLayout: "Floating",
  initialTag: "1",
  tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  term: "xterm",
};

/** Resolves plugins into their runtime types. */
export function resolvePlugins<T>(specifiers: PluginSpecifiers): T[] {
  if (typeof specifiers === "string") {
    specifiers = [specifiers];
  }

  return specifiers
    .map((specifier) => {
      if (isAbsolute(specifier)) {
        return require(specifier);
      } else {
        console.error("Unsupported/unhandled plugin specifier kind: " + specifier);
        return null;
      }
    })
    .filter((plugin) => plugin != null);
}
