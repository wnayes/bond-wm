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
  /** XCB_CLIENT_MESSAGE */
  ClientMessage = 33,
  MappingNotify = 34,
  GenericEvent = 35,
}

export enum X11_KEY_MODIFIER {
  ShiftMask = 1 << 0,
  LockMask = 1 << 1,
  ControlMask = 1 << 2,
  Mod1Mask = 1 << 3,
  Mod2Mask = 1 << 4,
  Mod3Mask = 1 << 5,
  Mod4Mask = 1 << 6,
  Mod5Mask = 1 << 7,
}

export const XCB_EVENT_MASK_NO_EVENT = 0;

export const XCB_COPY_FROM_PARENT = 0;

export const XCB_CURRENT_TIME = 0;

export const XCB_GRAB_MODE_SYNC = 0;
export const XCB_GRAB_MODE_ASYNC = 1;

// Event masks
export enum XEventMask {
  KeyPress = 1,
  KeyRelease = 2,
  ButtonPress = 4,
  ButtonRelease = 8,
  EnterWindow = 16,
  LeaveWindow = 32,
  PointerMotion = 64,
  PointerMotionHint = 128,
  Button1Motion = 256,
  Button2Motion = 512,
  Button3Motion = 1024,
  Button4Motion = 2048,
  Button5Motion = 4096,
  ButtonMotion = 8192,
  KeymapState = 16384,
  Exposure = 32768,
  VisibilityChange = 65536,
  StructureNotify = 131072,
  ResizeRedirect = 262144,
  SubstructureNotify = 524288,
  SubstructureRedirect = 1048576,
  FocusChange = 2097152,
  PropertyChange = 4194304,
  ColormapChange = 8388608,
  OwnerGrabButton = 16777216,
}

export interface IXEvent {
  type: number;
  seq: number;
  name: string;
  format: number;
  wid: number;
  rawData: Buffer;
}

export interface IXConfigureInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  borderWidth: number;
  sibling: number;
  stackMode: number;
}

export enum CWMaskBits {
  CWX = 1 << 0,
  CWY = 1 << 1,
  CWWidth = 1 << 2,
  CWHeight = 1 << 3,
  CWBorderWidth = 1 << 4,
  CWSibling = 1 << 5,
  CWStackMode = 1 << 6,
}

export interface IXConfigureEvent extends IXEvent, IXConfigureInfo {
  mask: CWMaskBits;
}

export interface IXKeyEvent extends IXEvent {
  buttons: X11_KEY_MODIFIER;
  keycode: number;
}

export interface IXMotionNotifyEvent extends IXEvent {
  keycode: number;
  child: number;
  rootx: number;
  rooty: number;
  x: number;
  y: number;
  buttons: number;
  sameScreen: number;
}

export interface IXButtonReleaseEvent extends IXEvent {
  keycode: number;
  child: number;
  rootx: number;
  rooty: number;
  x: number;
  y: number;
  buttons: number;
  sameScreen: number;
}

export interface IXPropertyNotifyEvent extends IXEvent {
  atom: Atom;
  time: number;
  state: number;
}

export interface IClientMessageEvent extends IXEvent {
  message_type: Atom;
  data: number[];
}

export interface IXScreen {
  root: number;
  default_colormap: number;
  white_pixel: number;
  black_pixel: number;
  input_masks: number;
  pixel_width: number;
  pixel_height: number;
  mm_width: number;
  mm_height: number;
  min_installed_maps: number;
  max_installed_maps: number;
  root_visual: number;
  root_depth: number;
  backing_stores: number;
  depths: object;
}

export interface IXDisplay {
  screen: IXScreen[];
  client: IXClient;
  min_keycode: number;
  max_keycode: number;
}

export enum XPropMode {
  Replace = 0,
  Prepend = 1,
  Append = 2,
}

export interface XGetPropertyCallbackProps {
  type: Atom;
  data: Buffer;
  /** remaining data. property length on the server is offset*4 + prop.data.length + prop.bytesAfter */
  bytesAfter: number;
}

interface XQueryTreeResult {
  root: number;
  parent: number;
  children: number[];
}

type XExtension<T> = XExtensionInfo & T;

interface XExtensionInfo {
  present: boolean;
  majorOpcode: number;
  firstEvent: number;
  firstError: number;
  // Enable(): void?
}

interface XRandrScreen {
  px_width: number;
  px_height: number;
  mm_width: number;
  mm_height: number;
}

interface XRandrScreenInfo {
  rotations: unknown;
  root: number;
  timestamp: number;
  config_timestamp: number;
  sizeID: number;
  rotation: unknown;
  rate: unknown;
  rates: unknown[];
  screens: XRandrScreen[];
}

interface XRandrModeInfos {
  id: unknown;
  width: number;
  height: number;
  dot_clock: unknown;
  h_sync_start: unknown;
  h_sync_end: unknown;
  h_total: unknown;
  h_skew: unknown;
  v_sync_start: unknown;
  v_sync_end: unknown;
  v_total: unknown;
  modeflags: unknown;
  name: string;
}

interface XRandrScreenResources {
  timestamp: number;
  config_timestamp: number;
  crtcs: number[];
  outputs: number[];
  modeinfos: XRandrModeInfos[];
}

interface XRandrOutputInfo {
  timestamp: number;
  crtc: number;
  mm_width: number;
  mm_height: number;
  connection: unknown;
  subpixelOrder: unknown;
  preferredModes: unknown;
  crtcs: number[];
  modes: number[];
  clones: number[];
  name: string;
}

interface XRandrCtrcInfo {
  status: unknown;
  timestamp: unknown;
  x: number;
  y: number;
  width: number;
  height: number;
  mode: unknown;
  rotation: unknown;
  rotations: unknown;
  output: number[];
  possible: number[];
}

interface RandrExtension {
  events: {
    RRScreenChangeNotify: 0;
  };
  NotifyMask: {
    ScreenChange: 1;
    CrtcChange: 2;
    OutputChange: 4;
    OutputProperty: 8;
    All: 15;
  };
  Rotation: {
    Rotate_0: 1;
    Rotate_90: 2;
    Rotate_180: 4;
    Rotate_270: 8;
    Reflect_X: 16;
    Reflect_Y: 32;
  };
  ConfigStatus: {
    Sucess: 0;
    InvalidConfigTime: 1;
    InvalidTime: 2;
    Failed: 3;
  };
  ModeFlag: {
    HSyncPositive: 1;
    HSyncNegative: 2;
    VSyncPositive: 4;
    VSyncNegative: 8;
    Interlace: 16;
    DoubleScan: 32;
    CSync: 64;
    CSyncPositive: 128;
    CSyncNegative: 256;
    HSkewPresent: 512;
    BCast: 1024;
    PixelMultiplex: 2048;
    DoubleClock: 4096;
    ClockDivideBy2: 8192;
  };

  QueryVersion(clientMaj: number, clientMin: number, callback: XCbWithErr<[unknown]>): void;
  //SetScreenConfig(win, ts, configTs, sizeId, rotation, rate, cb): void;
  //SelectInput(win, mask): void;
  GetScreenInfo(win: number, cb: XCbWithErr<[info: XRandrScreenInfo]>): void;
  GetScreenResources(win: number, cb: XCbWithErr<[res: XRandrScreenResources]>): void;
  GetOutputInfo(output: number, ts: number, cb: XCbWithErr<[info: XRandrOutputInfo]>): void;
  GetCrtcInfo(crtc: number, configTs: number, cb: XCbWithErr<[info: XRandrCtrcInfo]>): void;
}

export type XRandrExtension = XExtension<RandrExtension>;

export interface XineramaScreenInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface XineramaExtension {
  major: number;
  minor: number;

  QueryVersion(clientMaj: number, clientMin: number, callback: XCbWithErr<[[major: number, minor: number]]>): void;
  IsActive(callback: XCbWithErr<[isActive: boolean]>): void;
  QueryScreens(callback: XCbWithErr<[info: XineramaScreenInfo[]]>): void;
}

export type XXineramaExtension = XExtension<XineramaExtension>;

/** ICCCM WM_SIZE_HINTS structure. */
export interface WMSizeHints {
  flags: WMSizeHintsFlags;
  // x, y, width, height - deprecated?
  minWidth: number | undefined;
  minHeight: number | undefined;
  maxWidth: number | undefined;
  maxHeight: number | undefined;
  widthIncrement: number | undefined;
  heightIncrement: number | undefined;
  minAspect: [number, number] | undefined;
  maxAspect: [number, number] | undefined;
  baseWidth: number | undefined;
  baseHeight: number;
  gravity: unknown;
}

enum WMSizeHintsFlags {
  /** User-specified x, y */
  USPosition = 1,
  /** User-specified width, height */
  USSize = 2,
  /** Program-specified position */
  PPosition = 4,
  /** Program-specified size */
  PSize = 8,
  /** Program-specified minimum size */
  PMinSize = 16,
  /** Program-specified maximum size */
  PMaxSize = 32,
  /** Program-specified resize increments */
  PResizeInc = 64,
  /** Program-specified min and max aspect ratios */
  PAspect = 128,
  /** Program-specified base size */
  PBaseSize = 256,
  /** Program-specified window gravity */
  PWinGravity = 512,
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

export enum XMapState {
  /** XCB_MAP_STATE_UNMAPPED */
  IsUnmapped = 0,
  /** XCB_MAP_STATE_UNVIEWABLE */
  IsUnviewable = 1,
  /** XCB_MAP_STATE_VIEWABLE */
  IsViewable = 2,
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
  mapState: XMapState;
  overrideRedirect: number;
  colormap: number;
  allEventMasks: number;
  myEventMasks: number;
  doNotPropogateMask: number;
}

export const PointerRoot = 1;

export enum XFocusRevertTo {
  None = 0,
  PointerRoot = 1,
  Parent = 2,
}

export interface XQueryPointerResult {
  root: number;
  child: number;
  rootX: number;
  rootY: number;
  childX: number;
  childY: number;
  keyMask: number;
  sameScreen: boolean;
}

interface UnpackStream {
  pack(format: string, args: unknown[]): void;
  flush(): void;
}

export interface XBuffer {
  unpack(format: string, offset?: number): number[];
}

export type XCbWithErr<TArgs extends unknown[], TError = unknown> = (err: TError, ...args: TArgs) => void;

export type Atom = number;

export interface XStandardAtoms {
  PRIMARY: 1;
  SECONDARY: 2;
  ARC: 3;
  ATOM: 4;
  BITMAP: 5;
  CARDINAL: 6;
  COLORMAP: 7;
  CURSOR: 8;
  CUT_BUFFER0: 9;
  CUT_BUFFER1: 10;
  CUT_BUFFER2: 11;
  CUT_BUFFER3: 12;
  CUT_BUFFER4: 13;
  CUT_BUFFER5: 14;
  CUT_BUFFER6: 15;
  CUT_BUFFER7: 16;
  DRAWABLE: 17;
  FONT: 18;
  INTEGER: 19;
  PIXMAP: 20;
  POINT: 21;
  RECTANGLE: 22;
  RESOURCE_MANAGER: 23;
  RGB_COLOR_MAP: 24;
  RGB_BEST_MAP: 25;
  RGB_BLUE_MAP: 26;
  RGB_DEFAULT_MAP: 27;
  RGB_GRAY_MAP: 28;
  RGB_GREEN_MAP: 29;
  RGB_RED_MAP: 30;
  STRING: 31;
  VISUALID: 32;
  WINDOW: 33;
  WM_COMMAND: 34;
  WM_HINTS: 35;
  WM_CLIENT_MACHINE: 36;
  WM_ICON_NAME: 37;
  WM_ICON_SIZE: 38;
  WM_NAME: 39;
  WM_NORMAL_HINTS: 40;
  WM_SIZE_HINTS: 41;
  WM_ZOOM_HINTS: 42;
  MIN_SPACE: 43;
  NORM_SPACE: 44;
  MAX_SPACE: 45;
  END_SPACE: 46;
  SUPERSCRIPT_X: 47;
  SUPERSCRIPT_Y: 48;
  SUBSCRIPT_X: 49;
  SUBSCRIPT_Y: 50;
  UNDERLINE_POSITION: 51;
  UNDERLINE_THICKNESS: 52;
  STRIKEOUT_ASCENT: 53;
  STRIKEOUT_DESCENT: 54;
  ITALIC_ANGLE: 55;
  X_HEIGHT: 56;
  QUAD_WIDTH: 57;
  WEIGHT: 58;
  POINT_SIZE: 59;
  RESOLUTION: 60;
  COPYRIGHT: 61;
  NOTICE: 62;
  FONT_NAME: 63;
  FAMILY_NAME: 64;
  FULL_NAME: 65;
  CAP_HEIGHT: 66;
  WM_CLASS: 67;
  WM_TRANSIENT_FOR: 68;
}

// https://github.com/sidorares/node-x11/wiki/Core-requests
export interface IXClient {
  atoms: XStandardAtoms;

  event_consumers: { [wid: number]: unknown };

  seq_num: number;
  pack_stream: UnpackStream;
  replies: { [seq_num: number]: unknown[] };

  require<T>(extensionName: string, callback: XCbWithErr<[ext: T]>): void;

  AllocColor(...args: unknown[]): unknown;
  AllocID(): number;
  AllowEvents(...args: unknown[]): unknown;
  CreateWindow(
    winId: number,
    parentId: number,
    x: number,
    y: number,
    width: number,
    height: number,
    borderWidth: number,
    depth: number,
    _class: unknown,
    visual: unknown,
    createWindowAdditionalValues?: unknown
  ): void;
  ChangeActivePointerGrab(...args: unknown[]): unknown;
  ChangeGC(...args: unknown[]): unknown;
  ChangeProperty(
    replaceMode: XPropMode,
    winId: number,
    propNameAtom: Atom,
    typeNameAtom: Atom,
    units: 8 | 16 | 32,
    data: Buffer | string
  ): void;
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
  DeleteProperty(winId: number, propNameAtom: Atom, callback?: XCbWithErr<[void]>): void;
  DestroyWindow(winId: number): void;
  ForceScreenSaver(...args: unknown[]): unknown;
  FreePixmap(...args: unknown[]): unknown;
  GetAtomName(atomId: Atom, callback: XCbWithErr<[atomName: string]>): void;
  GetGeometry(winId: number, callback: XCbWithErr<[drawable: XGeometry]>): void;
  GetImage(...args: unknown[]): unknown;
  GetInputFocus(): { focus: number; revertTo: XFocusRevertTo };
  GetKeyboardMapping(firstKeycode: number, count: number, callback: XCbWithErr<[list: number[][]]>): void;
  GetProperty(
    deleteAfterGet: unknown,
    wid: number,
    propNameAtom: Atom,
    typeNameAtom: Atom,
    offset: number,
    maxLen: number,
    callback: XCbWithErr<[XGetPropertyCallbackProps]>
  ): void;
  GetSelectionOwner(...args: unknown[]): unknown;
  GetWindowAttributes(wid: number, callback: XCbWithErr<[attrs: XWindowAttrs]>): void;
  GrabButton(...args: unknown[]): unknown;
  GrabKey(
    wid: number,
    ownerEvents: boolean,
    modifiers: number,
    key: number,
    pointerMode: number,
    keybMode: number
  ): void;
  GrabKeyboard(
    wid: number,
    ownerEvents: boolean,
    time: number,
    pointerMode: typeof XCB_GRAB_MODE_SYNC | typeof XCB_GRAB_MODE_ASYNC,
    keybMode: typeof XCB_GRAB_MODE_SYNC | typeof XCB_GRAB_MODE_ASYNC
  ): unknown;
  GrabPointer(
    wid: number,
    ownerEvents: boolean,
    mask: number,
    pointerMode: typeof XCB_GRAB_MODE_SYNC | typeof XCB_GRAB_MODE_ASYNC,
    keybMode: typeof XCB_GRAB_MODE_SYNC | typeof XCB_GRAB_MODE_ASYNC,
    confineTo: 0,
    cursor: 0,
    time: 0,
    callback: XCbWithErr<[unknown]>
  ): void;
  GrabServer(...args: unknown[]): unknown;
  InternAtom(returnOnlyIfExist: boolean, str: string, callback: XCbWithErr<[atomId: Atom]>): void;
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
  PutImage(
    format: unknown,
    drawable: unknown,
    gc: unknown,
    width: number,
    height: number,
    dstX: number,
    dstY: number,
    leftPad: unknown,
    depth: unknown,
    dataBuffer: Buffer
  ): void;
  QueryExtension<T>(name: string, callback: XCbWithErr<[ext: XExtension<T>]>): void;
  QueryPointer(winId: number, callback: XCbWithErr<[result: XQueryPointerResult]>): void;
  QueryTree(winId: number, callback: XCbWithErr<[result: XQueryTreeResult]>): void;
  RaiseWindow(winId: number): void;
  ReleaseID(id: number): void;
  ReparentWindow(winId: number, newParentId: number, x: number, y: number): void;
  ResizeWindow(...args: unknown[]): unknown;
  SendEvent(destination: number, propagate: boolean, eventMask: number, eventRawData: unknown): void;
  SetInputFocus(winId: number, revertTo: XFocusRevertTo): void;
  SetScreenSaver(...args: unknown[]): unknown;
  SetSelectionOwner(...args: unknown[]): unknown;
  TranslateCoordinates(...args: unknown[]): unknown;
  UngrabButton(...args: unknown[]): unknown;
  UngrabKey(...args: unknown[]): unknown;
  UngrabKeyboard(time: number): void;
  UngrabPointer(time: number): void;
  UngrabServer(...args: unknown[]): unknown;
  UnmapWindow(winId: number): void;
  WarpPointer(...args: unknown[]): unknown;
}

export interface IX11Client {
  on(eventName: string, callback: (...args: unknown[]) => void): void;
}

export interface IX11Mod {
  eventMask: typeof XEventMask;
  keySyms: unknown;

  createClient(callback: XCbWithErr<[display: IXDisplay]>): IX11Client;
}
