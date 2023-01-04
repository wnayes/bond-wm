import * as React from "react";
import { FunctionComponentElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector, useStore } from "react-redux";
import { resolvePluginsFromRenderer, RootState } from "@electron-wm/renderer-shared";
import { Layout } from "./layout/Layout";
import { useBrowserWindowSize } from "@electron-wm/plugin-utils";
import { IWindow, WallpaperModule } from "@electron-wm/shared";
import { geometriesDiffer } from "@electron-wm/shared";
import { configureScreenWorkAreaAction } from "@electron-wm/shared";
import { focusDesktopBrowser } from "@electron-wm/renderer-shared";

export interface IWorkAreaProps {
  screenIndex: number;
  windows: IWindow[];
}

export function WorkArea({ screenIndex, windows }: IWorkAreaProps) {
  const workAreaDiv = useRef<HTMLDivElement>(null);

  const store = useStore();
  const screen = useSelector((state: RootState) => state.screens[screenIndex]);
  const wallpaperComponents = useWallpaperComponents();

  useBrowserWindowSize(); // To trigger size recalculations.

  useLayoutEffect(() => {
    const clientRect = workAreaDiv.current?.getBoundingClientRect();

    if (screen && clientRect) {
      if (geometriesDiffer(screen.workArea, clientRect)) {
        store.dispatch(
          configureScreenWorkAreaAction({
            screenIndex,
            x: clientRect.x,
            y: clientRect.y,
            width: clientRect.width,
            height: clientRect.height,
          })
        );
      }
    }
  });

  const onWorkAreaClick = useCallback(() => {
    focusDesktopBrowser({ screenIndex, takeVisualFocus: true });
  }, [screenIndex]);

  return (
    <div id="workarea" ref={workAreaDiv} onClickCapture={onWorkAreaClick}>
      {wallpaperComponents}
      <Layout screen={screen} windows={windows} />
    </div>
  );
}

function useWallpaperComponents() {
  const wallpaperConfig = useSelector((state: RootState) => state.config.plugins?.wallpaper);

  const [wallpaperComponents, setWallpaperComponents] = useState<FunctionComponentElement<{}>[]>([]);

  useEffect(() => {
    (async () => {
      if (!wallpaperConfig) {
        setWallpaperComponents([]);
        return;
      }

      const modules = await resolvePluginsFromRenderer<WallpaperModule>(wallpaperConfig);
      const components = modules
        .map((wallpaperModule, i) => {
          const wallpaperComponent = wallpaperModule.default;
          if (typeof wallpaperComponent === "function") {
            return React.createElement(wallpaperComponent, { key: i });
          }
        })
        .filter((component) => component != null) as FunctionComponentElement<{}>[];
      setWallpaperComponents(components);
    })();
  }, [wallpaperConfig]);

  return wallpaperComponents;
}
