import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getFirstTagName, getTagNames } from "../tags";
import { IScreen, IGeometry } from "../types";

export type ScreensState = IScreen[];

const initialState: ScreensState = [];

export const screensSlice = createSlice({
  name: "screens",
  initialState,
  reducers: {
    addScreenAction: (state, { payload }: PayloadAction<any>) => {
      state.push({
        index: state.length,

        root: payload.root,

        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,

        // Work area is initially the same as screen area. Adjusts later based on Desktop render.
        workArea: {
          x: 0,
          y: 0,
          width: payload.width,
          height: payload.height,
        },

        tags: getTagNames(),
        currentTags: [getFirstTagName()],
      });
    },

    configureScreenWorkAreaAction: (state, { payload }: PayloadAction<{ screenIndex: number } & IGeometry>) => {
      state[payload.screenIndex].workArea = {
        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,
      };
    },

    setScreenCurrentTagsAction: (state, { payload }: PayloadAction<{ screenIndex: number; currentTags: string[] }>) => {
      state[payload.screenIndex].currentTags = payload.currentTags;
    },
  },
});

export const { addScreenAction, configureScreenWorkAreaAction, setScreenCurrentTagsAction } = screensSlice.actions;

export default screensSlice.reducer;
