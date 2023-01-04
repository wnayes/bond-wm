import { ipcMain } from "electron";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "original-fs";
import { log } from "./log";

const _loadedPackages = new Map<string, string>();

const PluginCacheFolderName = ".electron-wm-plugin-cache";

/**
 * Loads a npm package into a temp directory.
 * @param specifier NPM specifier, like `react` or `express@4`
 * @param installDirectory The absolute path of the directory where the packages will be installed.
 * @returns The absolute file path where the module was installed.
 */
export async function installPackage(specifier: string, installDirectory: string): Promise<string> {
  installDirectory = join(installDirectory, PluginCacheFolderName);

  const cacheKey = `${specifier}%${installDirectory}`;
  if (_loadedPackages.has(cacheKey)) {
    return _loadedPackages.get(cacheKey)!;
  }

  const packageAlias = encodeNpmSpecifier(specifier);
  const installName = `${packageAlias}@npm:${specifier}`;
  const cachePath = join(installDirectory, "node_modules", packageAlias);
  if (existsSync(cachePath)) {
    log(`Package ${installName} found at ${cachePath}`);
    _loadedPackages.set(cacheKey, cachePath);
    return cachePath;
  }

  log(`Installing ${installName} from npm into ${cachePath}...`);

  execNpmInstall(installName, installDirectory);

  _loadedPackages.set(cacheKey, cachePath);

  log(`Package ${installName} installed at ${cachePath}`);

  return cachePath;
}

export function setupPackageInstallMessageListener(): void {
  ipcMain.on("npm-package-install", (event, specifier: string, installDirectory: string) => {
    installPackage(specifier, installDirectory).then((installPath) => {
      event.sender.send("npm-package-install-result", { specifier, installDirectory, installPath });
    });
  });
}

/**
 * Invokes `npm install` in the package cache directory.
 * @param installName Name of package to install
 * @param installDirectory Directory where we will install
 */
function execNpmInstall(installName: string, installDirectory: string) {
  execFileSync("npm", [
    "install",
    "--no-package-lock",
    "--omit=dev",
    "--omit=peer",
    "--prefix",
    installDirectory,
    installName,
  ]);
}

/**
 * Encodes an npm specifier into a format acceptable as an package alias.
 * @param specifier Specifier string.
 */
function encodeNpmSpecifier(specifier: string): string {
  return (
    "p_" +
    specifier
      .replace(/@/g, "_at_")
      .replace(/\//g, "_slash_")
      .replace(/\^/g, "_caret_")
      .replace(/~/g, "_tilde_")
      .replace(/>=/g, "_gteq_")
      .replace(/>/g, "_gt_")
      .replace(/<=/g, "_lteq_")
      .replace(/</g, "_lt_")
      .replace(/\*/g, "_any_")
  );
}
