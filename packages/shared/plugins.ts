import { ComponentType, FunctionComponent } from "react";

/** Plugin configuration object exported by plugin modules. */
export interface RenderPluginConfig {
  component: ComponentType;
}

/** Plugin configuration object exported by layout plugin modules. */
export interface LayoutPluginConfig extends RenderPluginConfig {
  name: string;
  icon: string;
  supportsMaximize: boolean;
}

/** Expected layout plugin module exports. */
export interface LayoutModule {
  default: LayoutPluginConfig;
}

/** Expected taskbar plugin module exports. */
export interface TaskbarModule {
  default: FunctionComponent | RenderPluginConfig;
}

/** Expected wallpaper plugin module exports. */
export interface WallpaperModule {
  default: FunctionComponent | RenderPluginConfig;
}
