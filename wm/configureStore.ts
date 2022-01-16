import { applyMiddleware, Middleware } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { composeWithStateSync } from "electron-redux/main";
import windowReducer from "../shared/redux/windowSlice";
import screenReducer from "../shared/redux/screenSlice";

export function configureWMStore(middleware: Middleware[]) {
  const enhancer = composeWithStateSync(applyMiddleware(...middleware));

  return configureStore({
    reducer: {
      windows: windowReducer,
      screens: screenReducer,
    },
    enhancers: [enhancer],
  });
}

export type ServerStore = ReturnType<typeof configureWMStore>;
export type ServerRootState = ReturnType<ServerStore["getState"]>;
export type ServerDispatch = ServerStore["dispatch"];
