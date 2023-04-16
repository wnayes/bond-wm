import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { assignConfig, defaultConfig, IConfig } from "../config";

export const configSlice = createSlice({
  name: "config",
  initialState: defaultConfig,
  reducers: {
    setConfigAction: (state, { payload }: PayloadAction<Partial<IConfig>>) => {
      assignConfig(state, payload);
    },
  },
});

export const { setConfigAction } = configSlice.actions;

export default configSlice.reducer;
