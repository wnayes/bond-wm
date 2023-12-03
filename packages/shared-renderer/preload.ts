import { preload } from "electron-redux/preload";

// Importing the preload module automatically executes it.
// We need to somehow reference the module though, else esbuild wants to elide it.
// (This re-export is suitable for now, could be fragile if esbuild tree shakes harder in the future.)
export { preload };
