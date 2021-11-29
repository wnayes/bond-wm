const { createStore } = require("redux");

const { stateSyncEnhancer } = require("electron-redux/renderer");
const reducer = require("../shared/reducers.js").rendererReducer;

exports.configureStore = function configureStore() {
  return createStore(reducer, stateSyncEnhancer());
};
