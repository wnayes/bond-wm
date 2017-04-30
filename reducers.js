const { combineReducers } = require("redux");

function screens(state = [], action) {
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

function windows(state = {}, action) {
  let newState, window;
  switch (action.type) {
    case "ADD_WINDOW":
      window = action.payload;
      return Object.assign({}, state, {
        [window.wid]: {
            id: window.wid,
            x: window.x,
            y: window.y,
            width: window.width,
            height: window.height,
            visible: window.visible,
            decorated: window.decorated,
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
        x: action.payload.x,
        y: action.payload.y,
        width: action.payload.width,
        height: action.payload.height,
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

const rootReducer = combineReducers({
  screens,
  windows,
});

module.exports = rootReducer;