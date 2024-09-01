import React, { ReactNode, useCallback, useMemo, useState } from "react";
import "./StartMenuStyles.css";
import { IStartMenuContext, StartMenuContext } from "./StartMenuContext";

export interface IStartMenuButtonProps {
  children: () => ReactNode;
}

export function StartMenuButton(props: IStartMenuButtonProps) {
  const [showing, setShowing] = useState(false);

  const onClick = useCallback(() => {
    setShowing((shown) => !shown);
  }, []);

  const smContext = useMemo<IStartMenuContext>(
    () => ({
      close: () => setShowing(false),
    }),
    []
  );

  return (
    <StartMenuContext.Provider value={smContext}>
      <div className="startMenuButton" onClick={onClick}>
        Start
      </div>
      {showing && props.children()}
    </StartMenuContext.Provider>
  );
}
