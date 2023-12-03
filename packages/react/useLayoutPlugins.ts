import { RootState, resolvePluginsFromRenderer } from "@electron-wm/shared-renderer";
import { LayoutPluginInstance, selectConfigWithOverrides } from "@electron-wm/shared";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export function useLayoutPlugins(screenIndex: number | undefined): LayoutPluginInstance[] {
  const layoutConfig = useSelector((state: RootState) => {
    if (typeof screenIndex !== "number") {
      return undefined;
    }
    return selectConfigWithOverrides(state, screenIndex).plugins?.layout;
  });

  const [layoutPlugins, setLayoutPlugins] = useState<LayoutPluginInstance[]>([]);

  useEffect(() => {
    (async () => {
      if (layoutConfig) {
        const plugins = await resolvePluginsFromRenderer<LayoutPluginInstance>(layoutConfig);
        setLayoutPlugins(plugins);
      }
    })();
  }, [layoutConfig]);

  return layoutPlugins;
}
