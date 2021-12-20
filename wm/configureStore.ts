import { applyMiddleware, createStore, Middleware } from "redux";
import { composeWithStateSync } from "electron-redux/main";
import { mainReducer as reducer } from "../shared/reducers";

export function configureStore(middleware: Middleware[]) {
  const enhancer = composeWithStateSync(applyMiddleware(...middleware))
  return createStore(reducer, enhancer);
};
