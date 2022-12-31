import { applyMiddleware, Middleware } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { composeWithStateSync } from "electron-redux/main";
import { configReducer, pluginStateReducer, screenReducer, trayReducer, windowReducer } from "@electron-wm/shared";

export type ServerStore = ReturnType<typeof configureWMStore>;
export type ServerRootState = ReturnType<ServerStore["getState"]>;
export type ServerDispatch = ServerStore["dispatch"];

export function configureWMStore(middleware: Middleware[]) {
  const enhancer = composeWithStateSync(applyMiddleware(...middleware));

  const store = configureStore({
    reducer: {
      config: configReducer,
      pluginState: pluginStateReducer,
      screens: screenReducer,
      tray: trayReducer,
      windows: windowReducer,
    },
    enhancers: [enhancer],

    // Could try to tune this, but for now just disable it.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }),
  });
  return store;
}
