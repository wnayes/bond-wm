import * as React from "react";

interface IWindowContainerProps {
  children: React.ReactNode;
}

export function BasicFillContainer({ children }: IWindowContainerProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "absolute",
      }}
    >
      {children}
    </div>
  );
}

export function CenteringContainer({ children }: IWindowContainerProps) {
  return (
    <div
      style={{
        position: "absolute",
        display: "grid",
        placeContent: "center",
        height: "100%",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}
