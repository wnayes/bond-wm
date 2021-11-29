import { createStore } from "redux";
import { stateSyncEnhancer } from "electron-redux/main";
import { mainReducer as reducer } from "../shared/reducers";

export function configureStore() {
  return createStore(reducer, stateSyncEnhancer());
};
