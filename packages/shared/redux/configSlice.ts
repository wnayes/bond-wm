import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IConfigSlice {
  configPath: string;
  version: string;
}

export const configSlice = createSlice({
  name: "config",
  initialState: { configPath: "", version: "" } as IConfigSlice,
  reducers: {
    setConfigPathAction: (state, { payload }: PayloadAction<string>) => {
      state.configPath = payload;
    },

    setVersionAction: (state, { payload }: PayloadAction<string>) => {
      state.version = payload;
    },
  },
});

export const { setConfigPathAction, setVersionAction } = configSlice.actions;

export default configSlice.reducer;
