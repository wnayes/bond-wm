import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IConfig {
  initialTag: string;
  tags: string[];
  term: string;
}

const _defaultConfig: IConfig = {
  initialTag: "1",
  tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  term: "xterm",
};

export const configSlice = createSlice({
  name: "config",
  initialState: _defaultConfig,
  reducers: {
    setConfigAction: (state, { payload }: PayloadAction<Partial<IConfig>>) => {
      Object.assign(state, payload);
    },
  },
});

export const { setConfigAction } = configSlice.actions;

export default configSlice.reducer;
