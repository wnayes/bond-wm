import { XWMContext } from "./wm";
import { getRawPropertyValue, internAtomAsync } from "./xutils";

enum MotifFlags {
  MWM_HINTS_FUNCTIONS = 1 << 0,
  MWM_HINTS_DECORATIONS = 1 << 1,
}

enum MotifFunctions {
  MWM_FUNC_ALL = 1 << 0,
  MWM_FUNC_RESIZE = 1 << 1,
  MWM_FUNC_MOVE = 1 << 2,
  MWM_FUNC_MINIMIZE = 1 << 3,
  MWM_FUNC_MAXIMIZE = 1 << 4,
  MWM_FUNC_CLOSE = 1 << 5,
}

interface MotifHints {
  flags: MotifFlags;
  functions: MotifFunctions;
  decorations: boolean;
  inputMode: unknown;
  status: unknown;
}

const SIZEOF_MotifHints = 20;

export async function createMotifModule({ X }: XWMContext) {
  const atoms = {
    _MOTIF_WM_HINTS: await internAtomAsync(X, "_MOTIF_WM_HINTS"),
  };

  return {
    async getMotifHints(wid: number): Promise<MotifHints | undefined> {
      const { data } = await getRawPropertyValue(X, wid, atoms._MOTIF_WM_HINTS, atoms._MOTIF_WM_HINTS);

      if (!data || data.length < SIZEOF_MotifHints) {
        return;
      }

      const hints: MotifHints = {
        flags: data.readInt32LE(0),
        functions: data.readInt32LE(4),
        decorations: !!data.readInt32LE(8),
        inputMode: data.readInt32LE(12),
        status: data.readInt32LE(16),
      };
      return hints;
    },
  };
}

export function hasMotifDecorations(motifHints: MotifHints | null | undefined): boolean {
  if (!motifHints) {
    return true;
  }
  if (motifHints.flags & MotifFlags.MWM_HINTS_DECORATIONS) {
    return motifHints.decorations;
  }
  return true;
}
