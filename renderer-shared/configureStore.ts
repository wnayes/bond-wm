import { configureStore } from "@reduxjs/toolkit";
import { stateSyncEnhancer } from "electron-redux/renderer";
import windowReducer from "../shared/redux/windowSlice";
import screenReducer from "../shared/redux/screenSlice";
import taskbarReducer from "./redux/taskbarSlice";

export function configureRendererStore() {
  return configureStore({
    reducer: {
      windows: windowReducer,
      screens: screenReducer,
      taskbar: taskbarReducer,
    },
    enhancers: [stateSyncEnhancer()],
  });
}

export type Store = ReturnType<typeof configureRendererStore>;
export type RootState = ReturnType<Store["getState"]>;
export type RendererDispatch = Store["dispatch"];
