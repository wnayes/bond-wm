import { configureStore } from "@reduxjs/toolkit";
import configReducer from "./configSlice";
import desktopReducer from "./desktopSlice";
import screenReducer from "./screenSlice";
import trayReducer from "./traySlice";
import windowReducer from "./windowSlice";

/** Never called, used to get typings. */
function configureBasicStore() {
  return configureStore({
    reducer: {
      config: configReducer,
      desktop: desktopReducer,
      screens: screenReducer,
      tray: trayReducer,
      windows: windowReducer,
    },

    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }),
  });
}

export type SharedStore = ReturnType<typeof configureBasicStore>;
export type SharedRootState = ReturnType<SharedStore["getState"]>;
export type SharedDispatch = SharedStore["dispatch"];
