import { ComponentType, FunctionComponent } from "react";
import { IWindow } from "./window";
import { IScreen } from "./screen";
import { IGeometry } from "./types";

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

/** Plugin configuration object exported by plugin modules. */
export interface RenderPluginConfig {
  component: ComponentType<{ settings?: object }>;
}

export interface ILayoutFunctionProps<TSettings> {
  windows: readonly IWindow[];
  screen: IScreen;
  settings?: TSettings;
}

export interface LayoutFunction<TSettings> {
  (props: ILayoutFunctionProps<TSettings>): Map<number, IGeometry>;
}

/** Plugin configuration object exported by layout plugin modules. */
export interface LayoutPluginConfig<TSettings> {
  name: string;
  icon: string;
  supportsMaximize: boolean;
  fn: LayoutFunction<TSettings>;
}

/** Expected layout plugin module exports. */
export interface LayoutModule<TSettings = unknown> {
  default: LayoutPluginConfig<TSettings>;
}

/** Settings accepted by all layout plugins. */
export interface LayoutPluginSettings {
  name?: string;
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
