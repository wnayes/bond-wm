module.exports.addScreen = function addScreen(screen) {
  return {
    type: "ADD_SCREEN",
    payload: {
      width: screen.width,
      height: screen.height,
    }
  };
}

module.exports.addWindow = function addWindow(window) {
  return {
    type: "ADD_WINDOW",
    payload: window,
  };
}

module.exports.removeWindow = function removeWindow(wid) {
  return {
    type: "REMOVE_WINDOW",
    payload: wid
  };
}

module.exports.configureWindow = function configureWindow(wid, config) {
  return {
    type: "CONFIGURE_WINDOW",
    payload: Object.assign({
      wid
    }, config)
  };
}

module.exports.focusWindow = function focusWindow(wid) {
  return {
    type: "FOCUS_WINDOW",
    payload: wid
  };
}

module.exports.unfocusWindow = function unfocusWindow(wid) {
  return {
    type: "UNFOCUS_WINDOW",
    payload: wid
  };
}

module.exports.setWindowTitle = function setWindowTitle(wid, title) {
  return {
    type: "SET_WINDOW_TITLE",
    payload: {
      wid,
      title,
    }
  };
}

module.exports.setWindowVisible = function setWindowVisible(wid, visible) {
  return {
    type: "SET_WINDOW_VISIBLE",
    payload: {
      wid,
      visible,
    }
  };
}

module.exports.setWindowDecorated = function setWindowDecorated(wid, decorated) {
  return {
    type: "SET_WINDOW_DECORATED",
    payload: {
      wid,
      decorated,
    }
  };
}