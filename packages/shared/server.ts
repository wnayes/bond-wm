import { X11_KEY_MODIFIER } from "./X";

export enum XWMWindowType {
  Other = 0,
  Client = 1,
  Frame = 2,
  Desktop = 3,
}

export interface XWMEventConsumerArgs {
  wid: number;
}

export interface XWMEventConsumerArgsWithType extends XWMEventConsumerArgs {
  windowType: XWMWindowType;
}

/** Args object passed to keyboard events. */
export interface XWMEventConsumerKeyPressArgs extends XWMEventConsumerArgsWithType {
  modifiers: X11_KEY_MODIFIER;
  keycode: number;
  originalKeyString?: string;
}

/** One or more shortcut key mappings. */
export type KeyRegistrationMap = { [keyString: string]: (args: XWMEventConsumerKeyPressArgs) => void };

/** Interface provided by the window manager server. */
export interface IWindowManagerServer {
  restart(): void;
  quit(): void;

  closeFocusedWindow(): void;
  launchProcess(command: string): void;
  registerShortcuts(registeredKeys: KeyRegistrationMap): void;
  sendActiveWindowToNextScreen(): void;
  sendActiveWindowToTag(tagIndex: number): void;
  setTagIndexForActiveDesktop(tagIndex: number, relativeWid: number): Promise<void>;
  showDevtoolsForFocusedWindowFrame(): void;
  startDragFocusedWindow(): Promise<void>;
  switchToNextLayout(): Promise<void>;
}
