import { ComponentType, FunctionComponent } from "react";

/** Plugin configuration object exported by plugin modules. */
export interface RenderPluginConfig {
  component: ComponentType<{ settings?: object }>;
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

/** Settings accepted by all layout plugins. */
export interface LayoutPluginSettings {
  name?: string;
}

/** Expected taskbar plugin module exports. */
export interface TaskbarModule {
  default: FunctionComponent | RenderPluginConfig;
}

/** Expected wallpaper plugin module exports. */
export interface WallpaperModule {
  default: FunctionComponent | RenderPluginConfig;
}

/** Combination of a plugin module and any settings provided in config files for the plugin. */
export interface PluginInstance<T, S extends object = object> {
  exports: T;
  settings?: S;
}

/** Layout plugin instance type. */
export type LayoutPluginInstance = PluginInstance<LayoutModule, LayoutPluginSettings>;
