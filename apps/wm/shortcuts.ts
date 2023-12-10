import { IXDisplay, X11_KEY_MODIFIER } from "@electron-wm/shared";
import { log, logError } from "./log";
import { IXWMEventConsumer, XWMContext, XWMEventConsumerKeyPressArgs } from "./wm";
import * as nodeKeySym from "@electron-wm/keysym";

export type KeyRegistrationMap = { [keyString: string]: (args: XWMEventConsumerKeyPressArgs) => void };

interface KeyRegistrationInfo {
  originalKeyString: string;
  callback: (args: XWMEventConsumerKeyPressArgs) => void;
}

export interface ShortcutsModule extends IXWMEventConsumer {
  setupKeyShortcuts(rootWid: number, registeredKeys: KeyRegistrationMap): void;
  registerShortcut(rootWid: number, keyString: string, callback: (args: XWMEventConsumerKeyPressArgs) => void): void;
}

export async function createShortcutsModule({ X, XDisplay }: XWMContext): Promise<ShortcutsModule> {
  const mapping = await getKeyboardMapping(XDisplay);

  // keycode -> [keysym no modifier, keysym with shift, keysym with AltGr (?), ...others]
  const keycodeToKeysyms: number[][] = [];
  const keysymsToKeycode: number[] = [];
  const keysymsToKeycodeShift: number[] = [];
  for (let i = 0; i < mapping.length; i++) {
    const keycode = XDisplay.min_keycode + i;
    const keysyms = mapping[i];
    keycodeToKeysyms[keycode] = keysyms;
    if (keysyms[0] > 0) {
      keysymsToKeycode[keysyms[0]] = keycode;
    }
    if (keysyms[1] > 0) {
      keysymsToKeycodeShift[keysyms[1]] = keycode;
    }
  }

  const processedRegisteredKeys: {
    [keyModifiers: number]: { [keyCode: number]: KeyRegistrationInfo };
  } = {};

  function getXModifierForShortcutPiece(piece: string): number | null {
    switch (piece.toLowerCase()) {
      case "shift":
        return X11_KEY_MODIFIER.ShiftMask;
      case "ctrl":
      case "ctl":
      case "control":
        return X11_KEY_MODIFIER.ControlMask;
      case "mod4":
      case "win":
        return X11_KEY_MODIFIER.Mod4Mask;
      default:
        return null;
    }
  }

  function registerShortcut(
    rootWid: number,
    keyString: string,
    callback: (args: XWMEventConsumerKeyPressArgs) => void
  ): void {
    const pieces = keyString
      .split("+")
      .map((s) => s.trim())
      .filter((s) => !!s);
    if (pieces.length === 0) {
      return;
    }

    let xModifiers = 0;
    for (let i = 0; i < pieces.length - 1; i++) {
      const xModifier = getXModifierForShortcutPiece(pieces[i]);
      if (typeof xModifier === "number") {
        xModifiers |= xModifier;
      } else {
        logError("Unrecognized key modifier: " + pieces[i]);
      }
    }

    const lastPiece = pieces[pieces.length - 1];
    if (!lastPiece) {
      return;
    }

    // TODO: This is pretty messy / uncertain, just trying pretty much every combination...
    // Just not sure exactly how shift factors in.
    const hasShift = !!(xModifiers & X11_KEY_MODIFIER.ShiftMask);
    let keySym = nodeKeySym.fromName(hasShift ? toUpper(lastPiece) : toLower(lastPiece));
    if (!keySym) {
      keySym = nodeKeySym.fromName(lastPiece);
    }
    const keySymMap = hasShift ? keysymsToKeycodeShift : keysymsToKeycode;
    const keySymMapFallback = hasShift ? keysymsToKeycode : keysymsToKeycodeShift;
    const keycode = keySymMap[keySym?.keysym ?? -1] ?? keySymMapFallback[keySym?.keysym ?? -1];
    if (keycode > 0) {
      processedRegisteredKeys[xModifiers] ||= {};
      if (!processedRegisteredKeys[xModifiers][keycode]) {
        processedRegisteredKeys[xModifiers][keycode] = {
          originalKeyString: keyString,
          callback,
        };
        X.GrabKey(rootWid, true, xModifiers, keycode, 1 /* Async */, 1 /* Async */);
        log(`Registered modifiers: ${xModifiers}, keycode: ${keycode} for ${keyString}`);
      }
    } else {
      logError("Could not register " + keyString);
    }
  }

  return {
    setupKeyShortcuts(rootWid: number, registeredKeys: KeyRegistrationMap): void {
      for (const keyString in registeredKeys) {
        registerShortcut(rootWid, keyString, registeredKeys[keyString]);
      }
    },

    registerShortcut,

    onKeyPress(args) {
      const { keycode, modifiers } = args;
      const keysyms = keycodeToKeysyms[keycode];
      log("keysyms", keysyms);
      if (keysyms) {
        const keysym = keysyms[modifiers & X11_KEY_MODIFIER.ShiftMask ? 1 : 0];
        if (keysym) {
          log("keysym", keysym);
          log("fromKeysym", nodeKeySym.fromKeysym(keysym));
        }
      }

      if (processedRegisteredKeys[args.modifiers]) {
        const info = processedRegisteredKeys[args.modifiers][args.keycode];
        if (typeof info === "object" && typeof info.callback === "function") {
          log(`Running ${info.originalKeyString} shortcut handler`);
          args.originalKeyString = info.originalKeyString;
          info.callback(args);
          return true;
        }
      }

      return false;
    },
  };
}

async function getKeyboardMapping(XDisplay: IXDisplay): Promise<number[][]> {
  return new Promise((resolve, reject) => {
    const { min_keycode, max_keycode } = XDisplay;
    XDisplay.client.GetKeyboardMapping(min_keycode, max_keycode - min_keycode, (err, list) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(list);
    });
  });
}

// TODO: Any better way to do this? Probably doesn't work across locales...
const _toUpperMap: { [value: string]: string | undefined } = Object.assign(Object.create(null), {
  "0": ")",
  "1": "!",
  "2": "@",
  "3": "#",
  "4": "$",
  "5": "%",
  "6": "^",
  "7": "&",
  "8": "*",
  "9": "(",
  "`": "~",
});
const _toLowerMap: { [value: string]: string | undefined } = Object.create(null);
for (const lower in _toUpperMap) {
  _toLowerMap[_toUpperMap[lower]!] = lower;
}

function toUpper(value: string): string {
  if (value in _toUpperMap) {
    return _toUpperMap[value]!;
  }
  return value.toUpperCase();
}

function toLower(value: string): string {
  if (value in _toLowerMap) {
    return _toLowerMap[value]!;
  }
  return value.toLowerCase();
}
