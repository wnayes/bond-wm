import { IGeometry } from "./reducers";

export function addScreen(screen: { width: number, height: number }) {
  return {
    type: "ADD_SCREEN",
    payload: {
      width: screen.width,
      height: screen.height,
    }
  };
}

export function configureScreenWorkArea(screenIndex: number, config: IGeometry) {
  return {
    type: "CONFIGURE_SCREEN_WORK_AREA",
    payload: Object.assign({
      screenIndex
    }, config)
  };
}

export function addWindow(window: any) {
  return {
    type: "ADD_WINDOW",
    payload: window,
  };
}

export function removeWindow(wid: any) {
  return {
    type: "REMOVE_WINDOW",
    payload: wid
  };
}

export function configureWindow(wid: number, config: IGeometry) {
  return {
    type: "CONFIGURE_WINDOW",
    payload: Object.assign({
      wid
    }, config)
  };
}

export function configureInnerWindow(wid: number, config: any) {
  return {
    type: "CONFIGURE_INNER_WINDOW",
    payload: Object.assign({
      wid
    }, config)
  };
}

export function focusWindow(wid: number) {
  return {
    type: "FOCUS_WINDOW",
    payload: wid
  };
}

export function unfocusWindow(wid: number) {
  return {
    type: "UNFOCUS_WINDOW",
    payload: wid
  };
}

export function setWindowTitle(wid: number, title: string) {
  return {
    type: "SET_WINDOW_TITLE",
    payload: {
      wid,
      title,
    }
  };
}

export function setWindowVisible(wid: number, visible: boolean) {
  return {
    type: "SET_WINDOW_VISIBLE",
    payload: {
      wid,
      visible,
    }
  };
}

export function setWindowDecorated(wid: number, decorated: boolean) {
  return {
    type: "SET_WINDOW_DECORATED",
    payload: {
      wid,
      decorated,
    }
  };
}

export function toggleTaskbarRunField(visible: boolean) {
  return {
    type: visible ? "SHOW_RUN_FIELD" : "HIDE_RUN_FIELD",
    payload: visible,
    meta: {
      scope: "local",
    },
  };
}

export function setTaskbarRunFieldText(text: string) {
  return {
    type: "SET_RUN_FIELD_TEXT",
    payload: text,
    meta: {
      scope: "local",
    },
  };
}
