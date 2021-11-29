const { createStore, applyMiddleware } = require("redux");

exports.configureStore = function configureStore(scope, initialState = {}) {
  const rootReducer = require("./reducers.js");

  let store;
  if (scope === "main") {
    const { stateSyncEnhancer } = require("electron-redux/main");
    store = createStore(rootReducer, stateSyncEnhancer());
  }
  else {
    const { stateSyncEnhancer } = require("electron-redux/renderer");
    store = createStore(rootReducer, stateSyncEnhancer());
  }

  return store;
};
