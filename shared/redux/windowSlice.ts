import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IBounds, IGeometry } from "../types";
import { IWindow, ResizeDirection, WindowPosition } from "../window";

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
        outer: payload.outer ?? { height: 0, width: 0, x: 0, y: 0 },
        frameExtents: payload.frameExtents ?? { top: 0, left: 0, right: 0, bottom: 0 },
        visible: payload.visible ?? true,
        minimized: payload.minimized ?? false,
        maximized: payload.maximized ?? false,
        fullscreen: false,
        transientFor: payload.transientFor,
        position: payload.position ?? WindowPosition.Default,
        focused: false,
        acceptsFocus: payload.acceptsFocus,
        decorated: payload.decorated ?? true,
        urgent: payload.urgent,
        borderWidth: payload.borderWidth,
        title: payload.title,
        wmClass: payload.wmClass,
        screenIndex: payload.screenIndex ?? 0,
        tags: payload.tags ?? [],
        wmHints: payload.wmHints,
        normalHints: payload.normalHints,
        icons: payload.icons,
        _dragState: undefined,
        _originalSize: undefined,
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

    setWindowTagsAction: (state, action: PayloadAction<{ wid: number; tags: string[] }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].tags = payload.tags;
      }
    },

    focusWindowAction: (state, action: PayloadAction<{ wid: number | null }>) => {
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

    setWindowMinimizedAction: (state, action: PayloadAction<{ wid: number; minimized: boolean }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        const { minimized } = payload;
        const win = state[payload.wid];
        win.minimized = minimized;
      }
    },

    setWindowMaximizedAction: (state, action: PayloadAction<{ wid: number; maximized: boolean }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        const { maximized } = payload;
        const win = state[payload.wid];
        win.maximized = maximized;

        // Same reasoning as fullscreen.
        updateOriginalSizeState(win, maximized);
      }
    },

    setWindowFullscreenAction: (state, action: PayloadAction<{ wid: number; fullscreen: boolean }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        const { fullscreen } = payload;
        const win = state[payload.wid];
        win.fullscreen = fullscreen;

        // We keep track of the prior size before fullscreen and restore it when leaving fullscreen.
        // This is necessary for floating, where the window would otherwise remain effectively fullscreen,
        // since the layout wouldn't alter its "current size" (which happens to be fullscreen).
        updateOriginalSizeState(win, fullscreen);
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

    setWindowUrgentAction: (state, action: PayloadAction<{ wid: number; urgent: boolean }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid].urgent = payload.urgent;
      }
    },

    startDragAction: (
      state,
      action: PayloadAction<{ wid: number; moving?: boolean; resize?: ResizeDirection; coords: [x: number, y: number] }>
    ) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid]._dragState = {
          moving: payload.moving,
          resize: payload.resize,
          startCoordinates: payload.coords,
          startOuterSize: state[payload.wid].outer,
        };
        state[payload.wid].position = WindowPosition.UserPositioned;
      }
    },

    endDragAction: (state, action: PayloadAction<{ wid: number }>) => {
      const { payload } = action;
      if (assertWidInState(state, action)) {
        state[payload.wid]._dragState = undefined;
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

function updateOriginalSizeState(win: IWindow, setIt: boolean): void {
  if (setIt) {
    if (!win._originalSize) {
      win._originalSize = win.outer;
    }
  } else if (win._originalSize) {
    win.outer = win._originalSize;
    win._originalSize = undefined;
  }
}

export const {
  addWindowAction,
  removeWindowAction,
  configureWindowAction,
  setFrameExtentsAction,
  setWindowIntoScreenAction,
  setWindowTagsAction,
  focusWindowAction,
  setWindowTitleAction,
  setWindowMinimizedAction,
  setWindowMaximizedAction,
  setWindowFullscreenAction,
  setWindowPositionAction,
  setWindowVisibleAction,
  setWindowDecoratedAction,
  setWindowUrgentAction,
  startDragAction,
  endDragAction,
} = windowsSlice.actions;

export default windowsSlice.reducer;
