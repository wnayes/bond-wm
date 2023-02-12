import { ComponentType, FunctionComponent } from "react";

/** Plugin configuration object exported by plugin modules. */
export interface RenderPluginConfig {
  component: ComponentType;
}

/** Expected taskbar plugin module exports. */
export interface TaskbarModule {
  default: FunctionComponent | RenderPluginConfig;
}

/** Expected wallpaper plugin module exports. */
export interface WallpaperModule {
  default: FunctionComponent | RenderPluginConfig;
}
