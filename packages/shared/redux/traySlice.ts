import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IGeometry } from "../types";
import { RGBAArray } from "../colors";

export type ConfigureTrayPayload = { wid: number; screenIndex: number } & IGeometry;

export interface ITrayEntry {
  id: number;
  location: IGeometry;
}

export type TrayWindowDict = { [wid: number]: ITrayEntry };

export interface TrayState {
  backgroundColor: RGBAArray;
  windows: TrayWindowDict;
}

const initialState: TrayState = {
  backgroundColor: [0, 0, 0, 0],
  windows: {},
};

export const traySlice = createSlice({
  name: "tray",
  initialState,
  reducers: {
    addTrayWindowAction: (state, { payload }: PayloadAction<Partial<ITrayEntry> & { wid: number }>) => {
      state.windows[payload.wid] = {
        id: payload.wid,
        location: {
          x: 0,
          y: 0,
          height: 16,
          width: 16,
        },
      };
    },

    removeTrayWindowAction: (state, { payload }: PayloadAction<number>) => {
      delete state.windows[payload];
    },

    configureTrayWindowAction: (state, action: PayloadAction<ConfigureTrayPayload>) => {
      const { payload } = action;
      if (state.windows[payload.wid]) {
        if (typeof payload.x === "number") {
          state.windows[payload.wid].location.x = payload.x;
        }
        if (typeof payload.y === "number") {
          state.windows[payload.wid].location.y = payload.y;
        }
        if (typeof payload.width === "number") {
          state.windows[payload.wid].location.width = payload.width;
        }
        if (typeof payload.height === "number") {
          state.windows[payload.wid].location.height = payload.height;
        }
      }
    },

    setTrayBackgroundColorAction: (state, { payload }: PayloadAction<RGBAArray>) => {
      state.backgroundColor = payload;
    },
  },
});

export const { addTrayWindowAction, removeTrayWindowAction, configureTrayWindowAction, setTrayBackgroundColorAction } =
  traySlice.actions;

export default traySlice.reducer;
