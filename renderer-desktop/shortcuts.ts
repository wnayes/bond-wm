import { showDevTools } from "../renderer-shared/commands";
import { getScreenIndex } from "./utils";

export function hookShortcuts(el: HTMLElement): void {
    el.addEventListener("keydown", onKeydown);
}

function onKeydown(e: KeyboardEvent): void {
    if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch (e.key) {
            case "F12":
                showDevTools(getScreenIndex());
                break;
        }
    }
}
