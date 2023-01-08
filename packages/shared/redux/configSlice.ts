import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { defaultConfig, IConfig } from "../config";

export const configSlice = createSlice({
  name: "config",
  initialState: defaultConfig,
  reducers: {
    setConfigAction: (state, { payload }: PayloadAction<Partial<IConfig>>) => {
      for (const configPropName in payload) {
        switch (configPropName) {
          case "plugins":
            // Overwrite at the level of each plugin, not the entire plugins object.
            Object.assign(state.plugins!, payload[configPropName]);
            break;
          default:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            state[configPropName as keyof IConfig] = payload[configPropName as keyof Partial<IConfig>] as any;
            break;
        }
      }
    },
  },
});

export const { setConfigAction } = configSlice.actions;

export default configSlice.reducer;
