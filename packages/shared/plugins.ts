import { ComponentType, FunctionComponent } from "react";

/** Plugin configuration object exported by plugin modules. */
export interface RenderPluginConfig {
  component: ComponentType;
}

/** Expected wallpaper plugin module exports. */
export interface WallpaperModule {
  /** Wallpaper React function component. */
  default: FunctionComponent | RenderPluginConfig;
}
