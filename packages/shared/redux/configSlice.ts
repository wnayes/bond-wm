import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LayoutInfo } from "../layouts";
import { cloneConfig, ISerializableConfig } from "../config";

interface IConfigSlice {
  config: ISerializableConfig<LayoutInfo>;
  configPath: string;
  version: string;
}

export const configSlice = createSlice({
  name: "config",
  initialState: { configPath: "", version: "" } as IConfigSlice,
  reducers: {
    setConfigAction: (state, { payload }: PayloadAction<ISerializableConfig<LayoutInfo>>) => {
      state.config = cloneConfig(payload);
    },

    setConfigPathAction: (state, { payload }: PayloadAction<string>) => {
      state.configPath = payload;
    },

    setVersionAction: (state, { payload }: PayloadAction<string>) => {
      state.version = payload;
    },
  },
});

export const { setConfigAction, setConfigPathAction, setVersionAction } = configSlice.actions;

export default configSlice.reducer;
