import * as React from "react";
import { useCallback } from "react";
import { closeWindow } from "../../renderer-shared/commands";
import { IWindow } from "../../shared/reducers";

interface ITitleBarProps {
  window: IWindow;
}

export function TitleBar(props: ITitleBarProps) {
  const window = props.window;
  return (
    <div className="winTitleBar">
        <span className="winTitleBarText">{window.title}</span>
        <TitleBarCloseButton window={window} />
    </div>
  );
}

interface ITitleBarCloseButtonProps {
  window: IWindow;
}

function TitleBarCloseButton(props: ITitleBarCloseButtonProps) {
  const window = props.window;

  const onClick = useCallback(() => {
    closeWindow(window.id);
  }, [window]);

  return (
    <div className="winTitleBarCloseBtn" onClick={onClick}>X</div>
  );
}
