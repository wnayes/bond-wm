import { configureRendererStore } from "@electron-wm/renderer-shared";
import { setupWindowComponent } from "./components/WindowSetup";

const store = configureRendererStore();

// Debug code, remove eventually.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).store = store;
// store.subscribe(() => {
//   console.log(store.getState());
// });

const container = document.getElementById("content");
if (!container) {
  throw new Error("Missing container element in frame");
}
setupWindowComponent(container, store);
