import { ipcRenderer, IpcRenderer } from "electron";

const _npmPackagePromises: Map<string, Promise<unknown>> = new Map();

type PackageInstalledCallback = (installPath: string) => void;
const _onPackageInstalledCallbacks: Map<string, Set<PackageInstalledCallback>> = new Map();

interface NPMPackageInstallResult {
  specifier: string;
  installDirectory: string;
  installPath: string;
}

export function setupNPMPackageProxyListeners(ipcRenderer: IpcRenderer): void {
  ipcRenderer.on("npm-package-install-result", (event, result: NPMPackageInstallResult) => {
    const cacheKey = getCacheKey(result.specifier, result.installDirectory);
    const callbacks = _onPackageInstalledCallbacks.get(cacheKey);
    callbacks?.forEach((callback) => callback(result.installPath));

    _onPackageInstalledCallbacks.delete(cacheKey);
  });
}

export function requirePackage<T>(specifier: string, installDirectory: string): Promise<T> {
  const cacheKey = getCacheKey(specifier, installDirectory);
  if (!_npmPackagePromises.has(cacheKey)) {
    _npmPackagePromises.set(
      cacheKey,
      new Promise<T>((resolve) => {
        addOnPackageInstalledCallback(cacheKey, (installPath: string) => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          resolve(require(installPath));
        });

        ipcRenderer.send("npm-package-install", specifier, installDirectory);
      })
    );
  }

  return _npmPackagePromises.get(cacheKey) as Promise<T>;
}

function addOnPackageInstalledCallback(cacheKey: string, callback: PackageInstalledCallback): void {
  if (!_onPackageInstalledCallbacks.has(cacheKey)) {
    _onPackageInstalledCallbacks.set(cacheKey, new Set());
  }

  const callbackSet = _onPackageInstalledCallbacks.get(cacheKey)!;
  callbackSet.add(callback);
}

function getCacheKey(specifier: string, installDirectory: string): string {
  return `${specifier}%${installDirectory}`;
}
