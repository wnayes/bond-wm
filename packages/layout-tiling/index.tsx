import React from "react";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { useScreen, useWindows, LayoutPluginConfig } from "@electron-wm/plugin-utils";
import { windowIsDialog } from "@electron-wm/shared";
import { Window } from "@electron-wm/react-desktop";
import { CenteringContainer } from "@electron-wm/react-desktop";

/** A tiling layout for electron-wm. */
const Plugin: LayoutPluginConfig = {
  name: "Tiling",
  icon: pathToFileURL(path.join(__dirname, "tiling.png")).toString(),
  supportsMaximize: false,
  component: TilingLayout,
};
export default Plugin;

function TilingLayout() {
  const screen = useScreen();
  const windows = useWindows();

  const windowComponents = [];
  const isolatedWindowComponents = [];
  for (const win of windows) {
    if (win.fullscreen) {
      isolatedWindowComponents.push(<Window key={win.id} win={win} screen={screen} layout={Plugin} />);
    } else if (windowIsDialog(win)) {
      isolatedWindowComponents.push(
        <CenteringContainer key={win.id}>
          <Window key={win.id} win={win} screen={screen} layout={Plugin} />
        </CenteringContainer>
      );
    } else {
      windowComponents.push(<Window key={win.id} win={win} screen={screen} layout={Plugin} fill />);
    }
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          display: "grid",
          gridTemplateColumns: windowComponents.length > 1 ? "1fr 1fr" : "1fr",
          height: "100%",
          width: "100%",
        }}
      >
        {windowComponents}
      </div>
      {isolatedWindowComponents}
    </>
  );
}
