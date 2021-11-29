const { createStore, applyMiddleware } = require("redux");

exports.configureStore = function configureStore(scope, initialState = {}) {
  let store;
  if (scope === "main") {
    const { stateSyncEnhancer } = require("electron-redux/main");
    const reducer = require("./reducers.js").mainReducer;
    store = createStore(reducer, stateSyncEnhancer());
  }
  else {
    const { stateSyncEnhancer } = require("electron-redux/renderer");
    const reducer = require("./reducers.js").rendererReducer;
    store = createStore(reducer, stateSyncEnhancer());
  }

  return store;
};
