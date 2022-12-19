import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { defaultConfig, IConfig } from "../config";

export const configSlice = createSlice({
  name: "config",
  initialState: defaultConfig,
  reducers: {
    setConfigAction: (state, { payload }: PayloadAction<Partial<IConfig>>) => {
      Object.assign(state, payload);
    },
  },
});

export const { setConfigAction } = configSlice.actions;

export default configSlice.reducer;
