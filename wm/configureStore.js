const { createStore } = require("redux");

const { stateSyncEnhancer } = require("electron-redux/main");
const reducer = require("../shared/reducers.js").mainReducer;

exports.configureStore = function configureStore() {
  return createStore(reducer, stateSyncEnhancer());
};
