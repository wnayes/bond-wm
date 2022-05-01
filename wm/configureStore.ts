import { applyMiddleware, Middleware } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { composeWithStateSync } from "electron-redux/main";
import configReducer from "../shared/redux/configSlice";
import screenReducer from "../shared/redux/screenSlice";
import windowReducer from "../shared/redux/windowSlice";

export type ServerStore = ReturnType<typeof configureWMStore>;
export type ServerRootState = ReturnType<ServerStore["getState"]>;
export type ServerDispatch = ServerStore["dispatch"];

export function configureWMStore(middleware: Middleware[]) {
  const enhancer = composeWithStateSync(applyMiddleware(...middleware));

  const store = configureStore({
    reducer: {
      config: configReducer,
      screens: screenReducer,
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
