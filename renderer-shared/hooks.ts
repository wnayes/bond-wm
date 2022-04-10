import { useCallback, useEffect, useState } from "react";
import { IIconInfo } from "../shared/window";

export function useWindowSize(): { width: number; height: number } {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  const resizeHandler = useCallback(() => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, [resizeHandler]);

  return {
    width,
    height,
  };
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
      iconImageData.data[i * 4 + 1] = iconData[i] & 0xff;
      iconImageData.data[i * 4 + 2] = (iconData[i] >>> 8) & 0xff;
      iconImageData.data[i * 4 + 3] = (iconData[i] >>> 16) & 0xff;
      iconImageData.data[i * 4 + 0] = (iconData[i] >>> 24) & 0xff;
    }
    context.putImageData(iconImageData, 0, 0);
    setDataUri(canvas.toDataURL());
  }, [iconInfo]);

  return dataUri;
}
