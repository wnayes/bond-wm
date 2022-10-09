import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PluginState {
  [pluginName: string]: unknown;
}

const initialState: PluginState = {};

export const pluginStateSlice = createSlice({
  name: "pluginState",
  initialState,
  reducers: {
    setPluginState: (state, { payload }: PayloadAction<{ pluginName: string; value: unknown }>) => {
      state[payload.pluginName] = payload.value;
    },
  },
});

export const { setPluginState } = pluginStateSlice.actions;

export default pluginStateSlice.reducer;
