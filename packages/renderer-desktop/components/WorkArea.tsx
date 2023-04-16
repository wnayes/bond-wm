import * as React from "react";
import { FunctionComponentElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector, useStore } from "react-redux";
import { resolvePluginsFromRenderer, RootState } from "@electron-wm/renderer-shared";
import { Layout } from "./layout/Layout";
import { useBrowserWindowSize } from "@electron-wm/plugin-utils";
import { PluginInstance, selectConfigWithOverrides, WallpaperModule } from "@electron-wm/shared";
import { geometriesDiffer } from "@electron-wm/shared";
import { configureScreenWorkAreaAction } from "@electron-wm/shared";
import { focusDesktopBrowser } from "@electron-wm/renderer-shared";

export interface IWorkAreaProps {
  screenIndex: number;
}

export function WorkArea({ screenIndex }: IWorkAreaProps) {
  const workAreaDiv = useRef<HTMLDivElement>(null);

  const store = useStore();
  const screen = useSelector((state: RootState) => state.screens[screenIndex]);
  const wallpaperComponents = useWallpaperComponents(screenIndex);

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
      <Layout screen={screen} />
    </div>
  );
}

function useWallpaperComponents(screenIndex: number) {
  const wallpaperConfig = useSelector(
    (state: RootState) => selectConfigWithOverrides(state, screenIndex).plugins?.wallpaper
  );

  const [wallpaperComponents, setWallpaperComponents] = useState<FunctionComponentElement<{}>[]>([]);

  useEffect(() => {
    (async () => {
      if (!wallpaperConfig) {
        setWallpaperComponents([]);
        return;
      }

      const plugins = await resolvePluginsFromRenderer<PluginInstance<WallpaperModule>>(wallpaperConfig);
      const components = plugins
        .map((wallpaperPlugins, i) => {
          const wallpaperComponent = wallpaperPlugins.exports.default;
          if (typeof wallpaperComponent === "function") {
            return React.createElement(wallpaperComponent, { key: i });
          } else if (typeof wallpaperComponent === "object") {
            return React.createElement(wallpaperComponent.component, { key: i });
          }
        })
        .filter((component) => component != null) as FunctionComponentElement<{}>[];
      setWallpaperComponents(components);
    })();
  }, [wallpaperConfig]);

  return wallpaperComponents;
}
