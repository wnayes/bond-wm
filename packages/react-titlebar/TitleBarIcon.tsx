import React, { useLayoutEffect, useRef, useState } from "react";
import { callRef, useElementSize, useIconInfoDataUri, useWindow } from "@electron-wm/react";
import { IIconInfo } from "@electron-wm/shared";

const IconMultipleOf = 8;
const IconDefaultSize = 16;

interface ITitleBarIconProps {
  /**
   * Preferred icon size to use. If not specified, this is determined from
   * the available height in the title bar.
   */
  size?: 8 | 16 | 24 | 32 | 40 | 48;
}

export function TitleBarIcon({ size }: ITitleBarIconProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [parentSize, parentResizeRef] = useElementSize();
  const [preferredSize, setPreferredSize] = useState<number>(size ?? IconDefaultSize);
  const win = useWindow();
  const icon = useBestIcon(win?.icons, preferredSize);
  const dataUri = useIconInfoDataUri(icon);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    callRef(parentResizeRef, imgRef.current?.parentElement);
  });

  useLayoutEffect(() => {
    if (typeof size === "number") {
      setPreferredSize(size);
    }

    if (parentSize) {
      setPreferredSize(IconMultipleOf * Math.max(1, Math.floor(parentSize.height / IconMultipleOf)));
    }
  }, [size, parentSize]);

  // If there was no icon info, return null.
  // We expect dataUri to be absent the initial render; still render the img in preparation in this case.
  if (!icon) {
    return null;
  }

  return (
    <img
      ref={imgRef}
      className="winTitleBarIcon"
      style={{
        height: preferredSize,
        width: preferredSize,
      }}
      src={dataUri}
    />
  );
}

function useBestIcon(icons: IIconInfo[] | undefined, preferredSize: number): IIconInfo | null {
  if (!icons) {
    return null;
  }

  // Try to find an exact height match.
  // Otherwise, find the smallest icon that is larger than the preferredSize.
  let curBest: IIconInfo | null = null;
  function isBetter(other: IIconInfo): boolean {
    return !curBest || (other.height < curBest.height && other.height > preferredSize);
  }

  for (const iconInfo of icons) {
    if (iconInfo.height === preferredSize) {
      return iconInfo;
    }
    if (isBetter(iconInfo)) {
      curBest = iconInfo;
    }
  }
  return curBest;
}
