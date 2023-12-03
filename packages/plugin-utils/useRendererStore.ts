import { Store } from "@electron-wm/renderer-shared";
import { useStore } from "react-redux";

export function useRendererStore(): Store {
  return useStore() as Store;
}
