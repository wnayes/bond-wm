import * as React from "react";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
  restoreWindow,
  showContextMenu,
} from "../../renderer-shared/commands";
import { RootState } from "../../renderer-shared/configureStore";
import { useIconInfoDataUri } from "../../renderer-shared/hooks";
import { ContextMenuKind } from "../../shared/ContextMenuKind";
import { selectWindowMaximizeCanTakeEffect } from "../../shared/selectors";
import { IIconInfo, IWindow } from "../../shared/window";

interface ITitleBarProps {
  win: IWindow;
}

export function TitleBar(props: ITitleBarProps) {
  const { win } = props;

  const supportsMaximize = useSelector((state: RootState) => selectWindowMaximizeCanTakeEffect(state, win.id));
  const hasIcons = (win.icons?.length ?? 0) > 0;

  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(ContextMenuKind.Frame);
  }, []);

  return (
    <div className="winTitleBar" onContextMenu={onContextMenu}>
      {hasIcons && <TitleBarIcon icons={win.icons!} />}
      <span className="winTitleBarText">{win.title}</span>
      <TitleBarMinimizeButton win={win} />
      {supportsMaximize && <TitleBarMaximizeButton win={win} />}
      <TitleBarCloseButton win={win} />
    </div>
  );
}

interface ITitleBarCloseButtonProps {
  win: IWindow;
}

function TitleBarCloseButton(props: ITitleBarCloseButtonProps) {
  const { win } = props;

  const winId = win.id;
  const onClick = useCallback(() => {
    closeWindow(winId);
  }, [winId]);

  return (
    <div className="winTitleBarBtn winTitleBarCloseBtn" onClick={onClick} title="Close">
      <img className="winTitleBarBtnIcon" src="./assets/close.svg" />
    </div>
  );
}

interface ITitleBarMaximizeButtonProps {
  win: IWindow;
}

function TitleBarMaximizeButton(props: ITitleBarMaximizeButtonProps) {
  const { win } = props;

  const onClick = useCallback(() => {
    if (win.maximized) {
      restoreWindow(win.id);
    } else {
      maximizeWindow(win.id);
    }
  }, [win]);

  const graphic = win.maximized ? "./assets/restore.svg" : "./assets/maximize.svg";
  const tooltip = win.maximized ? "Restore" : "Maximize";

  return (
    <div className="winTitleBarBtn winTitleBarMaximizeBtn" onClick={onClick} title={tooltip}>
      <img className="winTitleBarBtnIcon" src={graphic} />
    </div>
  );
}

interface ITitleBarMinimizeButtonProps {
  win: IWindow;
}

function TitleBarMinimizeButton(props: ITitleBarMinimizeButtonProps) {
  const { win } = props;

  const winId = win.id;
  const onClick = useCallback(() => {
    minimizeWindow(winId);
  }, [winId]);

  return (
    <div className="winTitleBarBtn winTitleBarMinimizeBtn" onClick={onClick} title="Minimize">
      <img className="winTitleBarBtnIcon" src="./assets/minimize.svg" />
    </div>
  );
}

interface ITitleBarIconProps {
  icons: IIconInfo[];
}

function TitleBarIcon(props: ITitleBarIconProps) {
  const { icons } = props;

  const icon = icons[0]; // TODO: Pick "best" icon.
  const dataUri = useIconInfoDataUri(icon);

  // If there was no icon info, return null.
  // We expect dataUri to be absent the initial render; still render the img in preparation in this case.
  if (!icon) {
    return null;
  }

  return <img className="winTitleBarIcon" src={dataUri} />;
}
