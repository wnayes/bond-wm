import * as React from "react";
import { isUrgent } from "@bond-wm/shared";
import { useBrowserWindowSize } from "../useBrowserWindowSize";
import { WidContext, useWindow } from "../useWindow";
import { useTheme } from "../theming";
import { Provider } from "react-redux";
import { useCallback, useEffect, useState, ReactNode } from "react";
import { configureRendererStore, frameWindowMouseEnter, registerFrameWidListener } from "@bond-wm/shared-renderer";
import "./WindowFrameStyles.css";

interface IWindowFrameProps {
  children?: ReactNode;
}

interface WindowFrameStyle extends React.CSSProperties {
  "--window-active-bg-color": string;
  "--window-active-border-color": string;
  "--window-inactive-bg-color": string;
  "--window-inactive-border-color": string;
  "--window-urgent-bg-color": string;
  "--window-urgent-border-color": string;
}

let _onSetNewWidInReact: ((newWid: number) => void) | undefined;

// This needs to be registered early (script load) or else we get into a race condition.
registerFrameWidListener((newWid) => {
  // Update URL so that frame reload doesn't break the frame.
  const url = new URL(window.location.href);
  url.searchParams.set("wid", newWid + "");
  window.history.pushState({}, "", url);

  if (_onSetNewWidInReact) {
    _onSetNewWidInReact(newWid);
  }
});

/**
 * Component that renders a window frame around a client window.
 */
export function WindowFrame({ children }: IWindowFrameProps) {
  const [store] = useState(() => configureRendererStore());
  const [wid, setWid] = useState<number | null>(null);

  // Read an initial wid from query parameter, if provided.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- for debug
    (window as any).store = store;

    const urlParams = new URLSearchParams(window.location.search);
    const widParam = urlParams.get("wid");
    if (widParam) {
      const initialWid = parseInt(widParam, 10);
      setWid(initialWid);
      console.log("wid", initialWid);
    }
  }, [store]);

  useEffect(() => {
    if (_onSetNewWidInReact) {
      throw new Error("Only one WindowFrame component is allowed to render");
    }
    _onSetNewWidInReact = setWid;
    return () => {
      _onSetNewWidInReact = undefined;
    };
  }, []);

  const onFrameMouseEnter = useCallback(() => {
    if (wid) {
      frameWindowMouseEnter(wid);
    }
  }, [wid]);

  useEffect(() => {
    document.addEventListener("mouseenter", onFrameMouseEnter);
    return () => {
      document.removeEventListener("mouseenter", onFrameMouseEnter);
    };
  }, [onFrameMouseEnter]);

  if (typeof wid !== "number") {
    return null;
  }

  return (
    <Provider store={store}>
      <WidContext.Provider value={wid}>
        <WindowFrameInner>{children}</WindowFrameInner>
      </WidContext.Provider>
    </Provider>
  );
}

function WindowFrameInner({ children }: IWindowFrameProps) {
  const win = useWindow();
  useBrowserWindowSize(); // Triggers re-renders on resize.

  let className = "winWrapper";
  if (win?.focused) {
    className += " focused";
  }
  if (win && isUrgent(win)) {
    className += " urgent";
  }
  if (win?.fullscreen) {
    className += " fullscreen";
  }
  if (win?.maximized) {
    className += " maximized";
  }

  const theme = useTheme();

  const style: WindowFrameStyle = {
    "--window-active-bg-color": theme.window?.activeBackgroundColor ?? theme.primaryColor,
    "--window-active-border-color":
      theme.window?.activeBorderColor ?? theme.window?.activeBackgroundColor ?? theme.primaryColor,
    "--window-inactive-bg-color": theme.window?.inactiveBackgroundColor,
    "--window-inactive-border-color": theme.window?.inactiveBorderColor ?? theme.window?.inactiveBackgroundColor,
    "--window-urgent-bg-color": theme.window?.urgentBackgroundColor ?? theme.urgentColor,
    "--window-urgent-border-color":
      theme.window?.urgentBorderColor ?? theme.window?.urgentBackgroundColor ?? theme.urgentColor,
  };
  if (typeof win?.borderWidth === "number") {
    style.borderWidth = win.borderWidth;
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
