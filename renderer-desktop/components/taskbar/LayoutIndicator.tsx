import * as React from "react";
import { useCallback } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState } from "../../../renderer-shared/configureStore";
import { switchToNextLayout } from "../../../shared/layouts";

interface ILayoutIndicatorProps {
  screenIndex: number;
}

export function LayoutIndicator({ screenIndex }: ILayoutIndicatorProps) {
  const tag = useSelector((state: RootState) => state.screens[screenIndex].currentTags[0]);
  const currentLayout = useSelector((state: RootState) => state.screens[screenIndex].currentLayouts[tag]);

  const store = useStore();

  const onClick = useCallback(() => {
    switchToNextLayout(store, screenIndex);
  }, [store, screenIndex]);

  return (
    <div className="layoutIndicator" title={currentLayout} onClick={onClick}>
      {currentLayout}
    </div>
  );
}
