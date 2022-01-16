import { configureStore } from "../renderer-shared/configureStore";
import { setupWindowComponent } from "./components/WindowSetup";

const store = configureStore();

// Debug code, remove eventually.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).store = store;
store.subscribe(() => {
  console.log(store.getState());
});

const container = document.getElementById("content");
setupWindowComponent(container, store);
