import { combineReducers } from "redux";

export interface IScreen {
  width: number;
  height: number;
}

function screens(state: IScreen[] = [], action: any) {
  switch (action.type) {
    case "ADD_SCREEN":
      let newState = state.slice();
      newState.push({
        width: action.payload.width,
        height: action.payload.height
      });
      return newState;
    default:
      return state;
  }
}

function windows(state = {}, action: any) {
  let newState: any, window;
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
              x: window.x,
              y: window.y,
              width: window.width,
              height: window.height,
            },
            visible: window.visible,
            decorated: window.decorated,
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
          x: action.payload.x,
          y: action.payload.y,
          width: action.payload.width,
          height: action.payload.height,
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
