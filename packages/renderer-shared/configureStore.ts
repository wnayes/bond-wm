import { configureStore } from "@reduxjs/toolkit";
import { stateSyncEnhancer } from "electron-redux/renderer";
import { configReducer, pluginStateReducer, screenReducer, trayReducer, windowReducer } from "@electron-wm/shared";
import taskbarReducer from "./redux/taskbarSlice";

export function configureRendererStore() {
  return configureStore({
    reducer: {
      config: configReducer,
      pluginState: pluginStateReducer,
      screens: screenReducer,
      taskbar: taskbarReducer,
      tray: trayReducer,
      windows: windowReducer,
    },
    enhancers: [stateSyncEnhancer()],

    // It is enough to check these in the main process; no need for each renderer.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }),
  });
}

export type Store = ReturnType<typeof configureRendererStore>;
export type RootState = ReturnType<Store["getState"]>;
export type RendererDispatch = Store["dispatch"];
