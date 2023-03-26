import { useEffect, useState } from "react";
import { useSelector, useStore } from "react-redux";
import { IIconInfo, LayoutModule, LayoutPluginConfig } from "@electron-wm/shared";
import { RootState, Store } from "./configureStore";
import { resolvePluginsFromRenderer } from "./plugins";

export function useRendererStore(): Store {
  return useStore() as Store;
}

export function useIconInfoDataUri(iconInfo: IIconInfo): string | undefined {
  const [dataUri, setDataUri] = useState<string | undefined>();

  useEffect(() => {
    if (!iconInfo) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = iconInfo.width;
    canvas.height = iconInfo.height;
    const context = canvas.getContext("2d")!;
    const iconImageData = context.createImageData(iconInfo.width, iconInfo.height);
    const iconData = iconInfo.data;
    for (let i = 0; i < iconData.length; i++) {
      iconImageData.data[i * 4 + 0] = (iconData[i] >>> 16) & 0xff; // R
      iconImageData.data[i * 4 + 1] = (iconData[i] >>> 8) & 0xff; // G
      iconImageData.data[i * 4 + 2] = iconData[i] & 0xff; // B
      iconImageData.data[i * 4 + 3] = (iconData[i] >>> 24) & 0xff; // A
    }
    context.putImageData(iconImageData, 0, 0);
    setDataUri(canvas.toDataURL());
  }, [iconInfo]);

  return dataUri;
}

export function useLayoutPlugins() {
  const layoutConfig = useSelector((state: RootState) => state.config.plugins?.layout);

  const [layoutPlugins, setLayoutPlugins] = useState<LayoutPluginConfig[]>([]);

  useEffect(() => {
    (async () => {
      if (layoutConfig) {
        const modules = await resolvePluginsFromRenderer<LayoutModule>(layoutConfig);
        const plugins = modules.map((mod) => mod.default);
        setLayoutPlugins(plugins);
      }
    })();
  }, [layoutConfig]);

  return layoutPlugins;
}
