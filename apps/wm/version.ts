import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import { logError } from "./log";
import { setVersionAction } from "@bond-wm/shared";
import { ServerStore } from "./configureStore";

interface VersionJson {
  version: string;
}

export function readVersionInfo(store: ServerStore): void {
  const versionJsonPath = join(app.getAppPath(), "dist", "version.json");
  if (!existsSync(versionJsonPath)) {
    logError(`version.json missing at '${versionJsonPath}'`);
    return;
  }

  const versionJson: VersionJson = JSON.parse(readFileSync(versionJsonPath, "utf-8"));

  store.dispatch(setVersionAction(versionJson.version));
}
