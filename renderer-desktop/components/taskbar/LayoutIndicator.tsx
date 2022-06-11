import * as React from "react";
import { useCallback, useMemo } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState, Store } from "../../../renderer-shared/configureStore";
import { switchToNextLayout } from "../../../shared/layouts";
import { getLayouts } from "../../layouts";

interface ILayoutIndicatorProps {
  screenIndex: number;
}

export function LayoutIndicator({ screenIndex }: ILayoutIndicatorProps) {
  const tag = useSelector((state: RootState) => state.screens[screenIndex].currentTags[0]);
  const currentLayoutName = useSelector((state: RootState) => state.screens[screenIndex].currentLayouts[tag]);
  const currentLayout = useMemo(() => {
    return getLayouts().find((layout) => layout.name === currentLayoutName);
  }, [currentLayoutName]);

  const store: Store = useStore();

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
