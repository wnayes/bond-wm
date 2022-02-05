import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IBounds, IGeometry } from "../types";
import { IWindow, WindowPosition } from "../window";

export interface WindowsState {
  [wid: number]: IWindow;
}

const initialState: WindowsState = {};

export const windowsSlice = createSlice({
  name: "windows",
  initialState,
  reducers: {
    addWindowAction: (state, { payload }: PayloadAction<Partial<IWindow> & { wid: number }>) => {
      state[payload.wid] = {
        id: payload.wid,
        outer: payload.outer,
        frameExtents: payload.frameExtents || {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        visible: payload.visible,
        fullscreen: false,
        position: WindowPosition.Default,
        focused: false,
        decorated: payload.decorated,
        borderWidth: undefined,
        title: payload.title,
        wmClass: payload.wmClass,
        screenIndex: payload.screenIndex,
        tags: payload.tags,
        normalHints: payload.normalHints,
        dragState: undefined,
      };
    },

    removeWindowAction: (state, { payload }: PayloadAction<number>) => {
      delete state[payload];
    },

    configureWindowAction: (state, action: PayloadAction<{ wid: number } & Partial<IGeometry>>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        if (typeof payload.x === "number") {
          state[payload.wid].outer.x = payload.x;
        }
        if (typeof payload.y === "number") {
          state[payload.wid].outer.y = payload.y;
        }
        if (typeof payload.width === "number") {
          state[payload.wid].outer.width = payload.width;
        }
        if (typeof payload.height === "number") {
          state[payload.wid].outer.height = payload.height;
        }
      }
    },

    setFrameExtentsAction: (state, action: PayloadAction<{ wid: number } & IBounds>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].frameExtents.top = payload.top;
        state[payload.wid].frameExtents.left = payload.left;
        state[payload.wid].frameExtents.right = payload.right;
        state[payload.wid].frameExtents.bottom = payload.bottom;
      }
    },

    setWindowIntoScreenAction: (state, action: PayloadAction<{ wid: number; screenIndex: number }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].screenIndex = payload.screenIndex;
      }
    },

    focusWindowAction: (state, action: PayloadAction<{ wid: number }>) => {
      const { payload } = action;
      for (const widStr in state) {
        if (payload.wid === parseInt(widStr, 10)) {
          if (!state[payload.wid].focused) {
            state[payload.wid].focused = true;
          }
        } else if (state[widStr].focused) {
          state[widStr].focused = false;
        }
      }
    },

    setWindowTitleAction: (state, action: PayloadAction<{ wid: number; title: string }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].title = payload.title;
      }
    },

    setWindowFullscreenAction: (state, action: PayloadAction<{ wid: number; fullscreen: boolean }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].fullscreen = payload.fullscreen;
      }
    },

    setWindowPositionAction: (state, action: PayloadAction<{ wid: number; position: WindowPosition }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].position = payload.position;
      }
    },

    setWindowVisibleAction: (state, action: PayloadAction<{ wid: number; visible: boolean }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].visible = payload.visible;
        if (!payload.visible) {
          state[payload.wid].focused = false;
        }
      }
    },

    setWindowDecoratedAction: (state, action: PayloadAction<{ wid: number; decorated: boolean }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].decorated = payload.decorated;
      }
    },

    startDragAction: (
      state,
      action: PayloadAction<{ wid: number; moving?: boolean; coords: [x: number, y: number] }>
    ) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].dragState = {
          moving: payload.moving,
          startCoordinates: payload.coords,
          startOuterSize: state[payload.wid].outer,
        };
        state[payload.wid].position = WindowPosition.UserPositioned;
      }
    },

    endDragAction: (state, action: PayloadAction<{ wid: number }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].dragState = undefined;
      }
    },
  },
});

function assertWidInState(state: WindowsState, action: PayloadAction<{ wid: number }>): boolean {
  if (state[action.payload.wid]) {
    return true;
  }
  console.error("Action on unknown window", action);
  return false;
}

export const {
  addWindowAction,
  removeWindowAction,
  configureWindowAction,
  setFrameExtentsAction,
  setWindowIntoScreenAction,
  focusWindowAction,
  setWindowTitleAction,
  setWindowFullscreenAction,
  setWindowPositionAction,
  setWindowVisibleAction,
  setWindowDecoratedAction,
  startDragAction,
  endDragAction,
} = windowsSlice.actions;

export default windowsSlice.reducer;
