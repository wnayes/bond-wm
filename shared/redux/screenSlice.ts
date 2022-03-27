import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getFirstLayoutName } from "../layouts";
import { getFirstTagName, getTagNames } from "../tags";
import { IScreen, IGeometry } from "../types";

export type ScreensState = IScreen[];

const initialState: ScreensState = [];

export const screensSlice = createSlice({
  name: "screens",
  initialState,
  reducers: {
    addScreenAction: (state, { payload }: PayloadAction<Partial<IScreen>>) => {
      const tags = getTagNames();
      const currentLayouts = tags.reduce<{ [tag: string]: string }>((layoutTagMap, tag) => {
        layoutTagMap[tag] = getFirstLayoutName();
        return layoutTagMap;
      }, {});

      state.push({
        index: state.length,

        root: payload.root,

        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,

        zoom: 1,

        // Work area is initially the same as screen area. Adjusts later based on Desktop render.
        workArea: {
          x: 0,
          y: 0,
          width: payload.width,
          height: payload.height,
        },

        tags,
        currentTags: [getFirstTagName()],

        currentLayouts,
      });
    },

    setScreenZoomLevelAction: (state, { payload }: PayloadAction<{ screenIndex: number; zoom: number }>) => {
      state[payload.screenIndex].zoom = payload.zoom;
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

    setTagCurrentLayoutAction: (
      state,
      { payload }: PayloadAction<{ screenIndex: number; tag: string; layoutName: string }>
    ) => {
      state[payload.screenIndex].currentLayouts[payload.tag] = payload.layoutName;
    },
  },
});

export const {
  addScreenAction,
  setScreenZoomLevelAction,
  configureScreenWorkAreaAction,
  setScreenCurrentTagsAction,
  setTagCurrentLayoutAction,
} = screensSlice.actions;

export default screensSlice.reducer;
