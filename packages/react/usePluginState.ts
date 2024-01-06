import { useCallback } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState } from "@bond-wm/shared-renderer";
import { setPluginState } from "@bond-wm/shared";

type PluginStateUpdater<T> = (newValue: T) => void;

/** Returns the state object for a given plugin. */
export function usePluginState<T>(pluginName: string): [T | undefined, PluginStateUpdater<T | undefined>] {
  const store = useStore();

  const updater = useCallback(
    (newValue: T | undefined) => {
      store.dispatch(setPluginState({ pluginName, value: newValue }));
    },
    [pluginName, store]
  );

  return [useSelector((state: RootState) => state.pluginState[pluginName]) as T | undefined, updater];
}
