const { createStore, applyMiddleware, compose } = require("redux");
const { forwardToMain, forwardToRenderer, triggerAlias, replayActionMain, replayActionRenderer, getInitialStateRenderer } = require("electron-redux");

module.exports = function configureStore(scope, initialState = {}) {
  const rootReducer = require("./reducers.js");
  let otherMiddleware = [];

  let store;
  if (scope === "main") {
    store = createStore(
      rootReducer,
      initialState,
      applyMiddleware(
        triggerAlias,
        //...otherMiddleware,
        forwardToRenderer
      )
    );
  }
  else {
    store = createStore(
      rootReducer,
      getInitialStateRenderer(),
      applyMiddleware(
        forwardToMain,
        ...otherMiddleware
      )
    );
  }

  if (scope === "main")
    replayActionMain(store);
  else
    replayActionRenderer(store);

  return store;
}