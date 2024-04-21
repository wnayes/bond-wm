import { IScreen, IWindow, arraysEqual, intersect, setWindowTagsAction } from "@bond-wm/shared";
import { ServerStore } from "./configureStore";

/** Update the window's tags if the next screen has different tags visible. */
export function updateWindowTagsForNextScreen(store: ServerStore, win: IWindow, nextScreen: IScreen): void {
  const nextScreenTags = nextScreen.currentTags;
  const tagIntersect = intersect(win.tags, nextScreenTags);
  if (tagIntersect.length > 0) {
    if (!arraysEqual(tagIntersect, win.tags)) {
      store.dispatch(setWindowTagsAction({ wid: win.id, tags: tagIntersect }));
    }
  } else if (nextScreenTags.length > 0) {
    store.dispatch(setWindowTagsAction({ wid: win.id, tags: [nextScreenTags[0]] }));
  }
}
