
import { configureStore } from "../renderer-shared/configureStore";
import { setupIpc } from "../renderer-shared/ipcRenderer";
import { setupWindowComponent } from "./Window"

const store = configureStore();
setupIpc(store);
(window as any).store = store;
store.subscribe(() => {
    console.log(store.getState());
})

const container = document.getElementById("content");
setupWindowComponent(container, store);
