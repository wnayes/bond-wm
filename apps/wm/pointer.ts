import { geometryContains } from "@bond-wm/shared";
import { IXClient, XQueryPointerResult } from "@bond-wm/shared";
import { XWMContext } from "./wm";

export function queryPointer(X: IXClient, relativeWid: number): Promise<XQueryPointerResult> {
  return new Promise((resolve, reject) => {
    X.QueryPointer(relativeWid, (err, result) => {
      err ? reject(err) : resolve(result);
    });
  });
}

export async function getScreenIndexWithCursor(context: XWMContext, relativeWid: number): Promise<number> {
  const pointerInfo = await queryPointer(context.X, relativeWid);
  if (!pointerInfo) {
    return -1;
  }

  const screens = context.store.getState().screens.filter((s) => s.root === pointerInfo.root);
  if (!screens.length) {
    return -1;
  }

  if (screens.length === 1) {
    return screens[0].index;
  }

  // With Xinerama setup, we need to check the pointer coords to determine the screen.
  for (const screen of screens) {
    if (geometryContains(screen, pointerInfo.rootX, pointerInfo.rootY)) {
      return screen.index;
    }
  }

  return screens[0].index; // None matched above?
}
