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

export interface XGeometry {
  windowid: number;
  width: number;
  height: number;
  xPos: number;
  yPos: number;
  borderWidth: number;
  depth: number;
}

export interface XWindowAttrs {
  backingStore: number;
  visual: number;
  klass: number;
  bitGravity: number;
  winGravity: number;
  backingPlanes: number;
  backingPixel: number;
  saveUnder: number;
  mapIsInstalled: number;
  mapState: number;
  overrideRedirect: number;
  colormap: number;
  allEventMasks: number;
  myEventMasks: number;
  doNotPropogateMask: number;
}

export type XCbWithErr<TArgs extends any[]> = (err: unknown, ...args: TArgs) => void;

// https://github.com/sidorares/node-x11/wiki/Core-requests
export interface IXClient {
  atoms: {
    WM_NAME: unknown;
    STRING: unknown;
  }
  event_consumers: { [wid: number]: any };

  AllocColor(...args: unknown[]): unknown;
  AllocID(): number;
  AllowEvents(...args: unknown[]): unknown;
  CreateWindow(winId: number, parentId: number, x: number, y: number, width: number, height: number, borderWidth: number, depth: number, _class: unknown, visual: unknown, createWindowAdditionalValues: unknown): void;
  ChangeActivePointerGrab(...args: unknown[]): unknown;
  ChangeGC(...args: unknown[]): unknown;
  // replace mode: 0 replace, 1 prepend, 2 append
  // unitSize = 8/16/32 TODO: remove, use depending on buffer size
  ChangeProperty(replaceMode: XReplaceMode, winId: number, propNameAtom: unknown, typeNameAtom: unknown, units: unknown, data: unknown): void;
  ChangeSaveSet(a: number, wid: number): void;
  ChangeWindowAttributes(wid: number, values: { eventMask: unknown }, callback: XCbWithErr<[void]>): void;
  ClearArea(...args: unknown[]): unknown;
  ConfigureWindow(wid: number, info: Partial<IXConfigureInfo>): void;
  ConvertSelection(...args: unknown[]): unknown;
  CopyArea(...args: unknown[]): unknown;
  CreateColormap(...args: unknown[]): unknown;
  CreateCursor(...args: unknown[]): unknown;
  CreateGC(gcId: unknown, drawableId: unknown, createGCAdditionalValues: unknown): void;
  CreatePixmap(...args: unknown[]): unknown;
  DeleteProperty(winId: number, propNameAtom: unknown): void;
  DestroyWindow(winId: number): void;
  ForceScreenSaver(...args: unknown[]): unknown;
  FreePixmap(...args: unknown[]): unknown;
  GetAtomName(atomId: unknown, callback: (str: string) => void): void;
  GetGeometry(winId: number, callback: XCbWithErr<[drawable: XGeometry]>): void;
  GetImage(...args: unknown[]): unknown;
  GetInputFocus(...args: unknown[]): unknown;
  GetKeyboardMapping(...args: unknown[]): unknown;
  GetProperty(deleteAfterGet: unknown, wid: number, propNameAtom: unknown, typeNameAtom: unknown, offset: number, maxLen: number, callback: XCbWithErr<[XGetPropertyCallbackProps]>): void;
  GetSelectionOwner(...args: unknown[]): unknown;
  GetWindowAttributes(wid: number, callback: XCbWithErr<[attrs: XWindowAttrs]>): void;
  GrabButton(...args: unknown[]): unknown;
  GrabKey(wid: number, ownerEvents: boolean, modifiers: number, key: number, pointerMode: number, keybMode: number): void;
  GrabKeyboard(...args: unknown[]): unknown;
  GrabPointer(...args: unknown[]): unknown;
  GrabServer(...args: unknown[]): unknown;
  InternAtom(returnOnlyIfExist: boolean, str: string, callback: XCbWithErr<[atomId: unknown]>): void;
  KillClient(resource: number): void;
  KillKlient(...args: unknown[]): unknown;
  // typeNameAtom: 0 = AnyType
  // offset and maxLen in 4-byte units
  ListExtensions(callback: (stringArray: string[]) => void): void;
  ListFonts(...args: unknown[]): unknown;
  ListProperties(...args: unknown[]): unknown;
  LowerWindow(winId: number): void;
  MapWindow(winId: number): void;
  MoveWindow(...args: unknown[]): unknown;
  MoveResizeWindow(...args: unknown[]): unknown;
  PolyFillArc(...args: unknown[]): unknown;
  PolyFillRectangle(...args: unknown[]): unknown;
  PolyPoint(...args: unknown[]): unknown;
  PolyLine(...args: unknown[]): unknown;
  PolyText8(drawable: unknown, gc: unknown, x: number, y: number, items: unknown): void;
  PutImage(format: unknown, drawable: unknown, gc: unknown, width: number, height: number, dstX: number, dstY: number, leftPad: unknown, depth: unknown, dataBuffer: Buffer): void;
  QueryExtension(callback: (extDescription: unknown) => void): void;
  QueryPointer(winId: number): void;
  QueryTree(winId: number, callback: XCbWithErr<[result: XQueryTreeResult]>): void;
  RaiseWindow(winId: number): void;
  ReleaseID(id: number): void;
  ReparentWindow(winId: number, newParentId: number, x: number, y: number): void;
  ResizeWindow(...args: unknown[]): unknown;
  SendEvent(destination: number, propagate: boolean, eventMask: number, eventRawData: unknown): void;
  SetInputFocus(winId: number, val: number): void;
  SetScreenSaver(...args: unknown[]): unknown;
  SetSelectionOwner(...args: unknown[]): unknown;
  TranslateCoordinates(...args: unknown[]): unknown;
  UngrabButton(...args: unknown[]): unknown;
  UngrabKey(...args: unknown[]): unknown;
  UngrabKeyboard(...args: unknown[]): unknown;
  UngrabPointer(...args: unknown[]): unknown;
  UngrabServer(...args: unknown[]): unknown;
  UnmapWindow(winId: number): void;
  WarpPointer(...args: unknown[]): unknown;
}
