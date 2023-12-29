import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IGeometry } from "../types";

export type ConfigureTrayPayload = { wid: number; screenIndex: number } & Partial<IGeometry>;

export interface ITrayEntry {
  id: number;
  location: IGeometry;
}

export type TrayWindowDict = { [wid: number]: ITrayEntry };

export interface TrayState {
  windows: TrayWindowDict;
}

const initialState: TrayState = {
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
  },
});

export const { addTrayWindowAction, removeTrayWindowAction, configureTrayWindowAction } = traySlice.actions;

export default traySlice.reducer;
