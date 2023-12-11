import { configureRendererStore } from "@electron-wm/shared-renderer";
import { setupWindowComponent } from "./components/WindowSetup";
import { setConfigPath } from "@electron-wm/shared";

const store = configureRendererStore();
setConfigPath(store.getState().config.configPath);

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
