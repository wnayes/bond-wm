import * as React from "react";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
  restoreWindow,
  showContextMenu,
  useLayoutPlugins,
} from "@electron-wm/renderer-shared";
import { RootState } from "@electron-wm/renderer-shared";
import { useIconInfoDataUri } from "@electron-wm/renderer-shared";
import { ContextMenuKind } from "@electron-wm/shared";
import { selectWindowMaximizeCanTakeEffect } from "@electron-wm/shared";
import { IIconInfo, IWindow } from "@electron-wm/shared";

interface ITitleBarProps {
  win: IWindow;
}

export function TitleBar(props: ITitleBarProps) {
  const { win } = props;

  const layouts = useLayoutPlugins(win.screenIndex);
  const supportsMaximize = useSelector((state: RootState) => selectWindowMaximizeCanTakeEffect(state, layouts, win.id));
  const hasIcons = (win.icons?.length ?? 0) > 0;

  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(ContextMenuKind.Frame);
  }, []);

  const onMaximizeClick = useCallback(() => {
    if (!supportsMaximize) {
      return;
    }

    if (win.maximized) {
      restoreWindow(win.id);
    } else {
      maximizeWindow(win.id);
    }
  }, [win, supportsMaximize]);

  return (
    <div className="winTitleBar" onContextMenu={onContextMenu}>
      {hasIcons && <TitleBarIcon icons={win.icons!} />}
      {/* FIXME: The double click doesn't work due to -webkit-app-region: drag */}
      <span className="winTitleBarText" onDoubleClick={onMaximizeClick}>
        {win.title}
      </span>
      <TitleBarMinimizeButton win={win} />
      {supportsMaximize && <TitleBarMaximizeButton win={win} onClick={onMaximizeClick} />}
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
  onClick(): void;
}

function TitleBarMaximizeButton(props: ITitleBarMaximizeButtonProps) {
  const { win, onClick } = props;

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
