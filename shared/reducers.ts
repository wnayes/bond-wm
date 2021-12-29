import { combineReducers } from "redux";
import { getFirstTagName, getTagNames } from "./tags";

export interface IGeometry {
  x: number,
  y: number,
  width: number,
  height: number,
}

export interface IScreen {
  width: number;
  height: number;
  workArea: IGeometry;

  tags: string[];
  currentTags: string[];
}

function screens(state: IScreen[] = [], action: any) {
  switch (action.type) {
    case "ADD_SCREEN":
      {
        let newState = state.slice();
        newState.push({
          width: action.payload.width,
          height: action.payload.height,

          // Work area is initially the same as screen area. Adjusts later based on Desktop render.
          workArea: {
            x: 0,
            y: 0,
            width: action.payload.width,
            height: action.payload.height,
          },

          tags: getTagNames(),
          currentTags: [getFirstTagName()]
        });
        return newState;
      }
    case "SET_WORK_AREA":
      {
        let newState = state.slice();
        newState[action.payload.screenIndex] = { ...newState[action.payload.screenIndex] };
        newState[action.payload.screenIndex].workArea = {
          x: action.payload.x,
          y: action.payload.y,
          width: action.payload.width,
          height: action.payload.height,
        };
        return newState;
      }

    case "SET_CURRENT_TAGS":
      let newState = state.slice();
      newState[action.payload.screenIndex].currentTags = action.payload.currentTags;
      return newState;

    default:
      return state;
  }
}

export interface IWindow {
  id: number;
  outer: {
    x: number,
    y: number,
    width: number,
    height: number,
  };
  inner: {
    top: number,
    left: number,
    right: number,
    bottom: number,
  };
  visible: boolean;
  focused: boolean;
  decorated: boolean;
  title: string | undefined;
  screenIndex: number;
  tags: string[];
}

type WindowsState = { [wid: number]: IWindow };

function windows(state: WindowsState = {}, action: any) {
  let newState;
  switch (action.type) {
    case "ADD_WINDOW":
      {
        const win = action.payload as Partial<IWindow> & { wid: number };
        return Object.assign<WindowsState, WindowsState, WindowsState>({}, state, {
          [win.wid]: {
            id: win.wid,
            outer: win.outer,
            inner: {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            visible: win.visible,
            decorated: win.decorated,
            focused: false,
            title: win.title,
            screenIndex: win.screenIndex,
            tags: win.tags,
          }
        });
      }
    case "REMOVE_WINDOW":
      {
        const window = action.payload;
        newState = Object.assign({}, state);
        delete newState[window];
        return newState;
      }
    case "CONFIGURE_WINDOW":
      newState = Object.assign({}, state);
      if (newState[action.payload.wid]) {
        newState[action.payload.wid] = Object.assign({}, newState[action.payload.wid], {
          outer: {
            x: action.payload.x,
            y: action.payload.y,
            width: action.payload.width,
            height: action.payload.height,
          }
        });
        return newState;
      }
      else {
        console.error("Action on unknown window", action);
        return state;
      }
    case "CONFIGURE_INNER_WINDOW":
      newState = Object.assign({}, state);
      if (newState[action.payload.wid]) {
        newState[action.payload.wid] = Object.assign({}, newState[action.payload.wid], {
          inner: {
            top: action.payload.top,
            left: action.payload.left,
            right: action.payload.right,
            bottom: action.payload.bottom,
          }
        });
        return newState;
      }
      else {
        console.error("Action on unknown window", action);
        return state;
      }
    case "FOCUS_WINDOW":
      {
        const wid = action.payload;
        newState = Object.assign({}, state);
        if (newState[wid]) {
          newState[wid] = Object.assign({}, newState[wid], { focused: true });
          return newState;
        }
        else {
          console.error("Action on unknown window", action);
          return state;
        }
      }
    case "UNFOCUS_WINDOW":
      {
        const wid = action.payload;
        newState = Object.assign({}, state);
        if (newState[wid]) {
          newState[wid] = Object.assign({}, newState[wid], { focused: false });
          return newState;
        }
        else {
          console.error("Action on unknown window", action);
          return state;
        }
      }
    case "SET_WINDOW_TITLE":
      newState = Object.assign({}, state);
      if (newState[action.payload.wid]) {
        newState[action.payload.wid] = Object.assign({}, newState[action.payload.wid], { title: action.payload.title });
        return newState;
      }
      else {
        console.error("Action on unknown window", action);
        return state;
      }
    case "SET_WINDOW_VISIBLE":
      newState = Object.assign({}, state);
      if (newState[action.payload.wid]) {
        newState[action.payload.wid] = Object.assign({}, newState[action.payload.wid], { visible: !!action.payload.visible });
        return newState;
      }
      else {
        console.error("Action on unknown window", action);
        return state;
      }
    case "SET_WINDOW_DECORATED":
      newState = Object.assign({}, state);
      if (newState[action.payload.wid]) {
        newState[action.payload.wid] = Object.assign({}, newState[action.payload.wid], { decorated: !!action.payload.decorated });
        return newState;
      }
      else {
        console.error("Action on unknown window", action);
        return state;
      }

    default:
      return state;
  }
}

const initialTaskbarState = {
  showingRun: false,
};
function taskbar(state = initialTaskbarState, action: any) {
  let newState;
  switch (action.type) {
    case "SHOW_RUN_FIELD":
      newState = Object.assign({}, state);
      newState.showingRun = true;
      return newState;
    case "HIDE_RUN_FIELD":
      newState = Object.assign({}, state);
      newState.showingRun = false;
      return newState;
    default:
      return state;
  }
}

export const mainReducer = combineReducers({
  screens,
  windows,
});

export const rendererReducer = combineReducers({
  screens,
  windows,
  taskbar,
});
