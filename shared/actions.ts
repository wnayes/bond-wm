import { IBounds, IGeometry, IScreen, IWindow } from "./reducers";

type AddScreenProps = Pick<IScreen, "x" | "y" | "width" | "height" | "root">;

export function addScreen(screen: AddScreenProps) {
  return {
    type: "ADD_SCREEN",
    payload: {
      root: screen.root,
      x: screen.x,
      y: screen.y,
      width: screen.width,
      height: screen.height,
    },
  };
}

export function configureScreenWorkArea(screenIndex: number, config: IGeometry) {
  return {
    type: "CONFIGURE_SCREEN_WORK_AREA",
    payload: {
      screenIndex,
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
    },
  };
}

export function setScreenCurrentTags(screenIndex: number, currentTags: string[]) {
  return {
    type: "SET_CURRENT_TAGS",
    payload: { screenIndex, currentTags },
  };
}

export function addWindow(wid: number, win: Partial<IWindow>) {
  return {
    type: "ADD_WINDOW",
    payload: Object.assign({ wid }, win),
  };
}

export function removeWindow(wid: number) {
  return {
    type: "REMOVE_WINDOW",
    payload: wid,
  };
}

export function configureWindow(wid: number, config: IGeometry) {
  return {
    type: "CONFIGURE_WINDOW",
    payload: {
      wid,
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
    },
  };
}

export function setWindowFrameExtents(wid: number, config: IBounds) {
  return {
    type: "SET_WINDOW_FRAME_EXTENTS",
    payload: Object.assign(
      {
        wid,
      },
      config
    ),
  };
}

export function setWindowIntoScreen(wid: number, screenIndex: number) {
  return {
    type: "SET_WINDOW_INTO_SCREEN",
    payload: {
      wid,
      screenIndex,
    },
  };
}

export function focusWindow(wid: number) {
  return {
    type: "FOCUS_WINDOW",
    payload: wid,
  };
}

export function unfocusWindow(wid: number) {
  return {
    type: "UNFOCUS_WINDOW",
    payload: wid,
  };
}

export function setWindowTitle(wid: number, title: string) {
  return {
    type: "SET_WINDOW_TITLE",
    payload: {
      wid,
      title,
    },
  };
}

export function setWindowVisible(wid: number, visible: boolean) {
  return {
    type: "SET_WINDOW_VISIBLE",
    payload: {
      wid,
      visible,
    },
  };
}

export function setWindowDecorated(wid: number, decorated: boolean) {
  return {
    type: "SET_WINDOW_DECORATED",
    payload: {
      wid,
      decorated,
    },
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
