import { Tuple, configureStore } from "@reduxjs/toolkit";
import { stateSyncEnhancer } from "electron-redux/renderer";
import {
  configReducer,
  desktopReducer,
  pluginStateReducer,
  screenReducer,
  trayReducer,
  windowReducer,
} from "@bond-wm/shared";

export function configureRendererStore() {
  return configureStore({
    reducer: {
      config: configReducer,
      desktop: desktopReducer,
      pluginState: pluginStateReducer,
      screens: screenReducer,
      tray: trayReducer,
      windows: windowReducer,
    },

    // It is enough to check these in the main process; no need for each renderer.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }),

    enhancers: () => {
      return new Tuple(stateSyncEnhancer());
    },
  });
}

export type Store = ReturnType<typeof configureRendererStore>;
export type RootState = ReturnType<Store["getState"]>;
export type RendererDispatch = Store["dispatch"];
