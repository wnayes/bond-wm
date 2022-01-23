import * as React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../renderer-shared/configureStore";

interface ILayoutIndicatorProps {
  screenIndex: number;
}

export function LayoutIndicator({ screenIndex }: ILayoutIndicatorProps) {
  const tag = useSelector((state: RootState) => state.screens[screenIndex].currentTags[0]);
  const currentLayout = useSelector((state: RootState) => state.screens[screenIndex].currentLayouts[tag]);

  return (
    <div className="layoutIndicator" title={currentLayout}>
      {currentLayout}
    </div>
  );
}
