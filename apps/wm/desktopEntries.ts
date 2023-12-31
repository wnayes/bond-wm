import { readFile, readdir } from "node:fs/promises";
import { extname, isAbsolute, join } from "node:path";
import { XWMContext } from "./wm";
import { UserDirectoryKind, getXDGUserDirectory } from "./xdg";
import { DesktopEntry, DesktopEntryKind, DesktopEntryMap, setDesktopEntries } from "@electron-wm/shared";
import { encodeArrayBufferToBase64 } from "./base64";
import { log, logError } from "./log";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DesktopEntryObject = require("freedesktop-desktop-entry");

interface DesktopEntryObjectShape {
  JSON: Record<string, DesktopEntryObjectGroup>;
}

interface DesktopEntryObjectGroup {
  entries: DesktopEntryObjectEntries;
  comment: string;
  precedingComment: string[];
}

interface DesktopEntryObjectEntries {
  [name: string]: DesktopEntryObjectEntryProperties;
}

interface DesktopEntryObjectEntryProperties {
  value: string;
  comment: string;
  precedingComment: string[];
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const FreedesktopIcons = require("freedesktop-icons") as FreedesktopIconsModule;

interface FreedesktopIconsModule {
  (
    icons: IconDescription | IconDescription[],
    themes?: string[] | string,
    exts?: string[] | string,
    fallbackPaths?: string[] | string
  ): Promise<string | null>;

  clearCache(): void;
}

interface IconDescription {
  name: string;

  /* filters each theme's icon directories, case-insensitive */
  type?: "fixed" | "scalable" | "threshold";
  context?: string;
  size?: number;
  scale?: number;
}

export interface DesktopEntriesModule {
  launchDesktopEntry(entryName: string): void;
}

export async function createDesktopEntriesModule({ store, wmServer }: XWMContext): Promise<DesktopEntriesModule> {
  const desktopFolder = await getXDGUserDirectory(UserDirectoryKind.Desktop);
  if (desktopFolder) {
    const desktopEntries = await parseDesktopEntries(desktopFolder);
    store.dispatch(setDesktopEntries(desktopEntries));
  }

  return {
    launchDesktopEntry(entryName: string): void {
      log("launchDesktopEntry", entryName);

      const entries = store.getState().desktop?.entries;
      const entry = entries[entryName];
      if (entry) {
        switch (entry.kind) {
          case DesktopEntryKind.Application:
            {
              const exec = sanitizeExecString(entry.target);
              if (exec) {
                wmServer.launchProcess(exec);
              }
            }
            break;
          default:
            logError(`Unhandled desktop entry kind: ${entry.kind}`);
            break;
        }
      }
    },
  };
}

async function parseDesktopEntries(desktopFolder: string): Promise<DesktopEntryMap> {
  const entries: DesktopEntryMap = {};
  const files = await readdir(desktopFolder, {});
  for (const fileName of files) {
    if (!isDesktopFile(fileName)) {
      continue;
    }
    const filePath = join(desktopFolder, fileName);
    const object = new DesktopEntryObject(filePath) as DesktopEntryObjectShape;
    const desktopEntryGroup = object.JSON["Desktop Entry"];
    if (!desktopEntryGroup || !desktopEntryGroup.entries) {
      continue;
    }
    const desktopEntryGroupEntries = desktopEntryGroup.entries;
    if (
      isTrueValue(desktopEntryGroupEntries["NoDisplay"]?.value) ||
      isTrueValue(desktopEntryGroupEntries["Hidden"]?.value)
    ) {
      continue;
    }

    const entry: DesktopEntry = {
      key: fileName,
      name: desktopEntryGroupEntries["Name"]?.value,
      kind: parseDesktopEntryKind(desktopEntryGroupEntries["Type"]?.value),
      icon: await parseDesktopEntryIcon(desktopEntryGroupEntries["Icon"]?.value),
    };
    if (!entry.name) {
      continue;
    }
    switch (entry.kind) {
      case DesktopEntryKind.Application:
        entry.target = desktopEntryGroupEntries["Exec"]?.value;
        entry.workingDirectory = desktopEntryGroupEntries["Path"]?.value;
        break;
      case DesktopEntryKind.Link:
        entry.target = desktopEntryGroupEntries["URL"]?.value;
        break;
      case DesktopEntryKind.Directory:
        continue; // Not supporting currently.
    }
    entries[fileName] = entry;
  }

  return entries;
}

function isDesktopFile(fileName: string): boolean {
  return fileName.endsWith(".desktop");
}

function isTrueValue(value: string | null | undefined): boolean {
  return value === "true";
}

function parseDesktopEntryKind(typeString: string): DesktopEntryKind {
  switch (typeString) {
    case "Link":
      return DesktopEntryKind.Link;
    case "Directory":
      return DesktopEntryKind.Directory;
    case "Application":
    default:
      return DesktopEntryKind.Application;
  }
}

async function parseDesktopEntryIcon(iconString: string): Promise<string | undefined> {
  if (isAbsolute(iconString)) {
    return await readIconAsync(iconString);
  }

  // First probe for SVG alone. The API seems to not return SVG otherwise, preferring 256px png.
  const svgPath = await FreedesktopIcons(
    [
      {
        name: iconString,
        type: "scalable",
      },
    ],
    undefined,
    ["svg"]
  );
  if (svgPath) {
    return await readIconAsync(svgPath);
  }

  const pngPath = await FreedesktopIcons(
    [
      {
        name: iconString,
        size: 48,
      },
      { name: iconString },
    ],
    undefined,
    ["png"]
  );
  if (pngPath) {
    return await readIconAsync(pngPath);
  }

  return undefined;
}

async function readIconAsync(iconPath: string): Promise<string | undefined> {
  switch (extname(iconPath).toLowerCase()) {
    case ".png":
      {
        const fileBytes = await readFile(iconPath);
        return "data:image/png;base64," + encodeArrayBufferToBase64(fileBytes);
      }
      break;
    case ".svg":
      {
        const fileBytes = await readFile(iconPath);
        return "data:image/svg+xml;base64," + encodeArrayBufferToBase64(fileBytes);
      }
      break;
  }
  return undefined;
}

function sanitizeExecString(exec: string | null | undefined): string {
  if (typeof exec !== "string") {
    return "";
  }

  return exec
    .replaceAll("%u", "")
    .replaceAll("%U", "")
    .replaceAll("%f", "")
    .replaceAll("%F", "")
    .replaceAll("%i", "")
    .replaceAll("%c", "")
    .replaceAll("%k", "")
    .trim();
}
