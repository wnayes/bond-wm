import { Store } from "@electron-wm/shared-renderer";
import { useStore } from "react-redux";

export function useRendererStore(): Store {
  return useStore() as Store;
}
