import { combineReducers } from "redux";

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
}

function windows(state: { [wid: number]: IWindow } = {}, action: any) {
  let newState, window;
  switch (action.type) {
    case "ADD_WINDOW":
      window = action.payload;
      return Object.assign({}, state, {
        [window.wid]: {
            id: window.wid,
            outer: {
              x: window.x,
              y: window.y,
              width: window.width,
              height: window.height,
            },
            inner: {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            visible: window.visible,
            decorated: window.decorated,
            focused: false,
            title: window.title,
        }
      });
    case "REMOVE_WINDOW":
      window = action.payload;
      newState = Object.assign({}, state);
      delete newState[window];
      return newState;
    case "CONFIGURE_WINDOW":
      newState = Object.assign({}, state);
      newState[action.payload.wid] = Object.assign({}, newState[action.payload.wid], {
        outer: {
          x: action.payload.x,
          y: action.payload.y,
          width: action.payload.width,
          height: action.payload.height,
        }
      });
      return newState;
    case "CONFIGURE_INNER_WINDOW":
      newState = Object.assign({}, state);
      newState[action.payload.wid] = Object.assign({}, newState[action.payload.wid], {
        inner: {
          top: action.payload.top,
          left: action.payload.left,
          right: action.payload.right,
          bottom: action.payload.bottom,
        }
      });
      return newState;
    case "FOCUS_WINDOW":
      window = action.payload;
      newState = Object.assign({}, state);
      newState[window] = Object.assign({}, newState[window], { focused: true });
      return newState;
    case "UNFOCUS_WINDOW":
      window = action.payload;
      newState = Object.assign({}, state);
      newState[window] = Object.assign({}, newState[window], { focused: false });
      return newState;
    case "SET_WINDOW_TITLE":
      newState = Object.assign({}, state);
      newState[action.payload.wid] = Object.assign({}, newState[action.payload.wid], { title: action.payload.title });
      return newState;
    case "SET_WINDOW_VISIBLE":
      newState = Object.assign({}, state);
      newState[action.payload.wid] = Object.assign({}, newState[action.payload.wid], { visible: !!action.payload.visible });
      return newState;
    case "SET_WINDOW_DECORATED":
      newState = Object.assign({}, state);
      newState[action.payload.wid] = Object.assign({}, newState[action.payload.wid], { decorated: !!action.payload.decorated });
      return newState;
    default:
      return state;
  }
}

const initialTaskbarState = {
  showingRun: false,
  runCommand: "",
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
    case "SET_RUN_FIELD_TEXT":
      newState = Object.assign({}, state);
      newState.runCommand = action.payload;
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
