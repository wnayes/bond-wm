import { LayoutPluginConfig, getConfigAsync, getConfigWithOverrides } from "@electron-wm/shared";
import { useEffect, useState } from "react";

export function useLayoutPlugins(screenIndex: number | undefined): readonly LayoutPluginConfig[] {
  const [layoutPlugins, setLayoutPlugins] = useState<readonly LayoutPluginConfig[]>([]);

  useEffect(() => {
    (async () => {
      if (typeof screenIndex === "number") {
        await getConfigAsync();
        setLayoutPlugins(getConfigWithOverrides(screenIndex).layouts);
      }
    })();
  }, [screenIndex]);

  return layoutPlugins;
}
