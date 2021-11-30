export enum X11_EVENT_TYPE {
  KeyPress = 2,
  KeyRelease = 3,
  ButtonPress = 4,
  ButtonRelease = 5,
  MotionNotify = 6,
  EnterNotify = 7,
  LeaveNotify = 8,
  FocusIn = 9,
  FocusOut = 10,
  KeymapNotify = 11,
  Expose = 12,
  GraphicsExpose = 13,
  NoExpose = 14,
  VisibilityNotify = 15,
  CreateNotify = 16,
  DestroyNotify = 17,
  UnmapNotify = 18,
  MapNotify = 19,
  MapRequest = 20,
  ReparentNotify = 21,
  ConfigureNotify = 22,
  ConfigureRequest = 23,
  GravityNotify = 24,
  ResizeRequest = 25,
  CirculateNotify = 26,
  CirculateRequest = 27,
  PropertyNotify = 28,
  SelectionClear = 29,
  SelectionRequest = 30,
  SelectionNotify = 31,
  ColormapNotify = 32,
  ClientMessage = 33,
  MappingNotify = 34,
  GenericEvent = 35
};

export enum X11_KEY_MODIFIER {
  ShiftMask = (1<<0),
  LockMask = (1<<1),
  ControlMask = (1<<2),
  Mod1Mask = (1<<3),
  Mod2Mask = (1<<4),
  Mod3Mask = (1<<5),
  Mod4Mask = (1<<6),
  Mod5Mask = (1<<7)
};

// Event masks
//  KeyPress = 1,
//   KeyRelease = 2,
//   ButtonPress = 4,
//   ButtonRelease = 8,
//   EnterWindow = 16,
//   LeaveWindow = 32,
//   PointerMotion = 64,
//   PointerMotionHint = 128,
//   Button1Motion = 256,
//   Button2Motion = 512,
//   Button3Motion = 1024,
//   Button4Motion = 2048,
//   Button5Motion = 4096,
//   ButtonMotion = 8192,
//   KeymapState = 16384,
//   Exposure = 32768,
//   VisibilityChange = 65536,
//   StructureNotify = 131072,
//   ResizeRedirect = 262144,
//   SubstructureNotify = 524288,
//   SubstructureRedirect = 1048576,
//   FocusChange = 2097152,
//   PropertyChange = 4194304,
//   ColormapChange = 8388608,
//   OwnerGrabButton = 16777216

export interface IXEvent {
  type: number;
  seq: number,
  name: string,
  format: number,
  wid: number,
  message_type: number,
  data: number[],
  rawData: Buffer,
}

interface IXConfigureInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  borderWidth: number;
  sibling: number;
  stackMode: number;
}

export interface IXConfigureEvent extends IXEvent, IXConfigureInfo { }

export interface IXKeyEvent extends IXEvent {
  buttons: number;
  keycode: number;
}

export interface IXScreen {
  root: number,
  default_colormap: number,
  white_pixel: number,
  black_pixel: number,
  input_masks: number,
  pixel_width: number,
  pixel_height: number,
  mm_width: number,
  mm_height: number,
  min_installed_maps: number,
  max_installed_maps: number,
  root_visual: number,
  root_depth: number,
  backing_stores: number,
  num_depths: number;
}

export interface IXDisplay {
  screen: IXScreen[];
  client: IXClient;
}

enum XReplaceMode {
  Replace = 0,
  Prepend = 1,
  Append = 2,
}

interface XGetPropertyCallbackProps {
  type: unknown; // atom
  data: Buffer;
  /** remaining data. property length on the server is offset*4 + prop.data.length + prop.bytesAfter */
  bytesAfter: number;
}

interface XQueryTreeResult {
  root: number;
  parent: number;
  children: number[];
}

export type XCbWithErr<TArgs extends any[]> = (err: unknown, ...args: TArgs) => void;

// https://github.com/sidorares/node-x11/wiki/Core-requests
export interface IXClient {
  atoms: {
    WM_NAME: unknown;
    STRING: unknown;
  }
  event_consumers: { [wid: number]: any };

  AllocID(): number;
  CreateWindow(winId: number, parentId: number, x: number, y: number, width: number, height: number, borderWidth: number, depth: number, _class: unknown, visual: unknown, createWindowAdditionalValues: unknown): void;
  // replace mode: 0 replace, 1 prepend, 2 append
  // unitSize = 8/16/32 TODO: remove, use depending on buffer size
  ChangeProperty(replaceMode: XReplaceMode, winId: number, propNameAtom: unknown, typeNameAtom: unknown, units: unknown, data: unknown): void;
  ChangeSaveSet(a: number, wid: number): void;
  ChangeWindowAttributes(wid: number, values: { eventMask: unknown }, callback: XCbWithErr<[void]>): void;
  ConfigureWindow(wid: number, info: Partial<IXConfigureInfo>): void;
  CreateGC(gcId: unknown, drawableId: unknown, createGCAdditionalValues: unknown): void;
  DeleteProperty(winId: number, propNameAtom: unknown): void;
  DestroyWindow(winId: number): void;
  GetAtomName(atomId: unknown, callback: (str: string) => void): void;
  GetGeometry(winId: number, callback: XCbWithErr<[drawable: unknown]>): void;
  GetProperty(deleteAfterGet: unknown, wid: number, propNameAtom: unknown, typeNameAtom: unknown, offset: number, maxLen: number, callback: XCbWithErr<[XGetPropertyCallbackProps]>): void;
  GetWindowAttributes(wid: number, callback: XCbWithErr<[unknown[]]>): void;
  GrabKey(wid: number, ownerEvents: boolean, modifiers: number, key: number, pointerMode: number, keybMode: number): void;
  InternAtom(returnOnlyIfExist: boolean, str: string, callback: XCbWithErr<[atomId: unknown]>): void;
  KillClient(resource: number): void;
  // typeNameAtom: 0 = AnyType
  // offset and maxLen in 4-byte units
  ListExtensions(callback: (stringArray: string[]) => void): void;
  LowerWindow(winId: number): void;
  MapWindow(winId: number): void;
  PolyFillRectangle(): void;
  PolyPoint(): void;
  PolyLine(): void;
  PolyText8(drawable: unknown, gc: unknown, x: number, y: number, items: unknown): void;
  QueryExtension(callback: (extDescription: unknown) => void): void;
  QueryPointer(winId: number): void;
  QueryTree(winId: number, callback: XCbWithErr<[result: XQueryTreeResult]>): void;
  RaiseWindow(winId: number): void;
  ReparentWindow(winId: number, newParentId: number, x: number, y: number): void;
  SendEvent(destination: number, propagate: boolean, eventMask: number, eventRawData: unknown): void;
  SetInputFocus(winId: number, val: number): void;
  PutImage(format: unknown, drawable: unknown, gc: unknown, width: number, height: number, dstX: number, dstY: number, leftPad: unknown, depth: unknown, dataBuffer: Buffer): void;
  UnmapWindow(winId: number): void;
}