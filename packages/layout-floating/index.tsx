import React from "react";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { useScreen, useWindows, LayoutPluginConfig } from "@electron-wm/plugin-utils";
import { windowIsDialog } from "@electron-wm/shared";
import { Window } from "@electron-wm/renderer-desktop";
import { BasicFillContainer, CenteringContainer } from "@electron-wm/renderer-desktop";

/** A floating layout for electron-wm. */
const Plugin: LayoutPluginConfig = {
  name: "Floating",
  icon: pathToFileURL(path.join(__dirname, "floating.png")).toString(),
  supportsMaximize: true,
  component: FloatingLayout,
};
export default Plugin;

function FloatingLayout() {
  const screen = useScreen();
  const windows = useWindows();

  const windowComponents = [];
  const isolatedWindowComponents = [];
  for (const win of windows) {
    if (win.fullscreen) {
      isolatedWindowComponents.push(<Window key={win.id} win={win} screen={screen} layout={Plugin} />);
    } else if (win.maximized) {
      isolatedWindowComponents.push(
        <BasicFillContainer key={win.id}>
          <Window key={win.id} win={win} screen={screen} layout={Plugin} />
        </BasicFillContainer>
      );
    } else if (windowIsDialog(win)) {
      isolatedWindowComponents.push(
        <CenteringContainer key={win.id}>
          <Window key={win.id} win={win} screen={screen} layout={Plugin} />
        </CenteringContainer>
      );
    } else {
      windowComponents.push(<Window key={win.id} win={win} screen={screen} layout={Plugin} />);
    }
  }

  return (
    <>
      <BasicFillContainer>{windowComponents}</BasicFillContainer>
      {isolatedWindowComponents}
    </>
  );
}
