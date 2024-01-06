import React from "react";
import { useCallback, useMemo } from "react";
import { useLayoutPlugins, useRendererStore, useScreen } from "@bond-wm/react";
import { getLayoutPluginName, switchToNextLayout } from "@bond-wm/shared";

/** A default layout indicator/toggle for bond-wm. */
export function LayoutIndicator() {
  const screen = useScreen();
  const screenIndex = screen.index;
  const tag = screen.currentTags[0];
  const currentLayoutName = screen.currentLayouts[tag];
  const layoutPlugins = useLayoutPlugins(screenIndex);
  const currentLayout = useMemo(() => {
    return layoutPlugins.find((plugin) => getLayoutPluginName(plugin) === currentLayoutName);
  }, [layoutPlugins, currentLayoutName]);

  const store = useRendererStore();

  const onClick = useCallback(() => {
    switchToNextLayout(store, layoutPlugins, screenIndex);
  }, [store, layoutPlugins, screenIndex]);

  if (!currentLayout) {
    return null;
  }

  let layoutIcon;
  if (currentLayout.icon) {
    layoutIcon = <img className="layoutIndicatorIcon" src={currentLayout.icon} />;
  }

  return (
    <div className="layoutIndicator" title={currentLayoutName} onClick={onClick}>
      {layoutIcon ?? currentLayoutName}
    </div>
  );
}
