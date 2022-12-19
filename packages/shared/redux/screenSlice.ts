import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IScreen } from "../screen";
import { IGeometry } from "../types";

export type ScreensState = IScreen[];

const initialState: ScreensState = [];

type AddScreenActionPayload = Partial<IScreen> & Pick<IScreen, "tags"> & { initialLayout: string; initialTag: string };

export const screensSlice = createSlice({
  name: "screens",
  initialState,
  reducers: {
    addScreenAction: (state, { payload }: PayloadAction<AddScreenActionPayload>) => {
      const currentLayouts = payload.tags.reduce<{ [tag: string]: string }>((layoutTagMap, tag) => {
        layoutTagMap[tag] = payload.initialLayout;
        return layoutTagMap;
      }, {});

      state.push({
        index: state.length,

        root: payload.root ?? 0,

        x: payload.x ?? 0,
        y: payload.y ?? 0,
        width: payload.width ?? 0,
        height: payload.height ?? 0,

        zoom: 1,

        // Work area is initially the same as screen area. Adjusts later based on Desktop render.
        workArea: {
          x: 0,
          y: 0,
          width: payload.width ?? 0,
          height: payload.height ?? 0,
        },

        tags: payload.tags,
        currentTags: [payload.initialTag],

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
