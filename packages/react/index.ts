// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./moduletypes.d.ts" />

export { usePluginState } from "./usePluginState";
export { useCombinedRef } from "./useCombinedRef";
export { useCompositeScreenSize } from "./useCompositeScreenSize";
export { useDomWindow, DomWindowContext } from "./useDomWindow";
export { useDesktopEntries, useDesktopEntriesForDesktopIcons } from "./useDesktopEntries";
export { useDesktopShortcut } from "./useDesktopShortcut";
export { useElementSize } from "./useElementSize";
export { useIconInfoDataUri } from "./useIconInfoDataUri";
export { useLayoutPlugins } from "./useLayoutPlugins";
export { useScreen } from "./useScreen";
export { useScreens } from "./useScreens";
export { useScreenIndex, setScreenIndex, getScreenIndex } from "./useScreenIndex";
export { useSupportsMaximize } from "./useSupportsMaximize";
export { useRendererStore } from "./useRendererStore";
export { useWindow, WidContext } from "./useWindow";
export { useWindows } from "./useWindows";
export { useBrowserWindowSize } from "./useBrowserWindowSize";

export { ChildWindow } from "./components/ChildWindow";
export { ErrorDisplay } from "./components/ErrorDisplay";
export { Stylesheet } from "./components/Stylesheet";

export { WindowClientArea } from "./frame/WindowClientArea";
export { WindowFrame } from "./frame/WindowFrame";

export { Desktop } from "./desktop/Desktop";
export { WorkArea } from "./desktop/WorkArea";

export { callRef } from "./callRef";
export type { ReactConfigModule } from "./plugins";

export { type Theme, ThemeContextProvider, useTheme } from "./theming";
