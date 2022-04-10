import { configureStore } from "@reduxjs/toolkit";
import windowReducer from "./windowSlice";
import screenReducer from "./screenSlice";

/** Never called, used to get typings. */
function configureBasicStore() {
  return configureStore({
    reducer: {
      windows: windowReducer,
      screens: screenReducer,
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
