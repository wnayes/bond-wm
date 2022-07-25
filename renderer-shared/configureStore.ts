import { configureStore } from "@reduxjs/toolkit";
import { stateSyncEnhancer } from "electron-redux/renderer";
import configReducer from "../shared/redux/configSlice";
import screenReducer from "../shared/redux/screenSlice";
import taskbarReducer from "./redux/taskbarSlice";
import trayReducer from "../shared/redux/traySlice";
import windowReducer from "../shared/redux/windowSlice";

export function configureRendererStore() {
  return configureStore({
    reducer: {
      config: configReducer,
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
