import React, { ReactNode, useCallback, useMemo, useState, useRef, useEffect } from "react";
import "./StartMenuStyles.css";
import { IStartMenuContext, StartMenuContext } from "./StartMenuContext";

export interface IStartMenuButtonProps {
  children: () => ReactNode;
}

export function StartMenuButton(props: IStartMenuButtonProps) {
  const [showing, setShowing] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const onClick = useCallback(() => {
    setShowing((shown) => !shown);
  }, []);

  const smContext = useMemo<IStartMenuContext>(
    () => ({
      close: () => setShowing(false),
    }),
    []
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [buttonRef]);

  return (
    <StartMenuContext.Provider value={smContext}>
      <div ref={buttonRef} className="startMenuButton" onClick={onClick}>
        Start
      </div>
      {showing && props.children()}
    </StartMenuContext.Provider>
  );
}
