import * as React from "react";
import { useCallback } from "react";
import { closeWindow, showContextMenu } from "../../renderer-shared/commands";
import { ContextMenuKind } from "../../shared/ContextMenuKind";
import { IWindow } from "../../shared/window";

interface ITitleBarProps {
  window: IWindow;
}

export function TitleBar(props: ITitleBarProps) {
  const window = props.window;

  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(ContextMenuKind.Frame);
  }, []);

  return (
    <div className="winTitleBar" onContextMenu={onContextMenu}>
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
    <div className="winTitleBarCloseBtn" onClick={onClick}>
      X
    </div>
  );
}
