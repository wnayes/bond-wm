import { createContext, useContext } from "react";

/**
 * Context that provides access to the DOM Window that child React content is
 * rendered into.
 */
export const DomWindowContext = createContext<Window | null>(null);

/**
 * Returns the DOM Window that the current component's children will render in.
 */
export function useDomWindow(): Window {
  return useContext(DomWindowContext) ?? window;
}
