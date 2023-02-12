import React from "react";
import { useCallback, useMemo } from "react";
import { useScreen, RenderPluginConfig } from "@electron-wm/plugin-utils";
import { switchToNextLayout } from "@electron-wm/shared";
import { getLayouts } from "@electron-wm/renderer-desktop";
import { useRendererStore } from "@electron-wm/renderer-shared";

/** A default layout indicator/toggle for electron-wm. */
const Plugin: RenderPluginConfig = {
  component: LayoutIndicator,
};
export default Plugin;

function LayoutIndicator() {
  const screen = useScreen();
  const tag = screen.currentTags[0];
  const currentLayoutName = screen.currentLayouts[tag];
  const currentLayout = useMemo(() => {
    return getLayouts().find((layout) => layout.name === currentLayoutName);
  }, [currentLayoutName]);

  const store = useRendererStore();

  const screenIndex = screen.index;
  const onClick = useCallback(() => {
    switchToNextLayout(store, screenIndex);
  }, [store, screenIndex]);

  let layoutIcon;
  if (currentLayout?.icon) {
    layoutIcon = <img className="layoutIndicatorIcon" src={"./" + currentLayout.icon} />;
  }

  return (
    <div className="layoutIndicator" title={currentLayoutName} onClick={onClick}>
      {layoutIcon ?? currentLayoutName}
    </div>
  );
}
