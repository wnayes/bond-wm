import React from "react";
import { useCallback, useMemo } from "react";
import { useScreen, RenderPluginConfig } from "@electron-wm/plugin-utils";
import { getLayoutPluginName, switchToNextLayout } from "@electron-wm/shared";
import { useLayoutPlugins, useRendererStore } from "@electron-wm/renderer-shared";

/** A default layout indicator/toggle for electron-wm. */
const Plugin: RenderPluginConfig = {
  component: LayoutIndicator,
};
export default Plugin;

function LayoutIndicator() {
  const screen = useScreen();
  const tag = screen.currentTags[0];
  const currentLayoutName = screen.currentLayouts[tag];
  const layoutPlugins = useLayoutPlugins();
  const currentLayout = useMemo(() => {
    return layoutPlugins.find((plugin) => getLayoutPluginName(plugin) === currentLayoutName);
  }, [layoutPlugins, currentLayoutName]);

  const store = useRendererStore();

  const screenIndex = screen.index;
  const onClick = useCallback(() => {
    switchToNextLayout(store, layoutPlugins, screenIndex);
  }, [store, layoutPlugins, screenIndex]);

  if (!currentLayout) {
    return null;
  }

  let layoutIcon;
  if (currentLayout.exports.default.icon) {
    layoutIcon = <img className="layoutIndicatorIcon" src={currentLayout.exports.default.icon} />;
  }

  return (
    <div className="layoutIndicator" title={currentLayoutName} onClick={onClick}>
      {layoutIcon ?? currentLayoutName}
    </div>
  );
}
