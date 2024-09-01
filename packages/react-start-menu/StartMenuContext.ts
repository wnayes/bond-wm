import { createContext, useContext } from "react";

export interface IStartMenuContext {
  close(): void;
}

export const StartMenuContext = createContext<IStartMenuContext | null>(null);

export function useStartMenuContext(): IStartMenuContext | null {
  return useContext(StartMenuContext);
}
