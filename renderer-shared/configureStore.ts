import { createStore } from "redux";

import { stateSyncEnhancer } from "electron-redux/renderer";
import { rendererReducer as reducer } from "../shared/reducers";

export function configureStore() {
  return createStore(reducer, stateSyncEnhancer());
};
