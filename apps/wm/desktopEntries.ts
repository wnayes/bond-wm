import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, isAbsolute, join } from "node:path";
import { XWMContext } from "./wm";
import { UserDirectoryKind, getXDGUserDirectory } from "./xdg";
import { DesktopEntry, DesktopEntryKind, DesktopEntryMap, setDesktopEntries, setEntries } from "@bond-wm/shared";
import { log, logError } from "./log";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DesktopEntryObject = require("freedesktop-desktop-entry");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FreedesktopIcons = require("freedesktop-icons") as FreedesktopIconsModule;

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

interface IDesktopEntryIconData {
  data: Buffer;
  mimeType: string;
}

export interface DesktopEntriesModule {
  launchDesktopEntry(entryName: string): void;
  getDesktopEntryIcon(entryName: string): Promise<IDesktopEntryIconData | null>;
}

const DesktopFileDirectories = [
  "/usr/share/applications",
  "/usr/local/share/applications",
  "~/.local/share/applications",
];

export async function createDesktopEntriesModule({ store, wmServer }: XWMContext): Promise<DesktopEntriesModule> {
  const desktopFolder = await getXDGUserDirectory(UserDirectoryKind.Desktop);
  if (desktopFolder && existsSync(desktopFolder)) {
    const desktopEntries = await parseDesktopEntries(desktopFolder);
    store.dispatch(setDesktopEntries(desktopEntries));
  }

  const allEntries = {};
  for (const folder of DesktopFileDirectories) {
    if (!existsSync(folder)) {
      continue;
    }
    const addlEntries = await parseDesktopEntries(folder);
    if (addlEntries) {
      Object.assign(allEntries, addlEntries);
    }
  }
  store.dispatch(setEntries(allEntries));

  function getEntryFromStore(entryName: string): DesktopEntry | null | undefined {
    const state = store.getState().desktop;
    return state?.desktopEntries[entryName] ?? state?.entries[entryName];
  }

  const iconDataByName: Map<string, IDesktopEntryIconData | null> = new Map();

  return {
    launchDesktopEntry(entryName: string): void {
      log("launchDesktopEntry", entryName);

      const entry = getEntryFromStore(entryName);
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

    async getDesktopEntryIcon(entryName: string): Promise<IDesktopEntryIconData | null> {
      const entry = getEntryFromStore(entryName);
      if (!entry || !entry.icon) {
        return null;
      }

      if (iconDataByName.has(entry.key)) {
        return iconDataByName.get(entry.key) ?? null;
      }
      const iconData = await parseDesktopEntryIcon(entry.icon);
      iconDataByName.set(entry.key, iconData);
      return iconData;
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

    const categoriesValue = desktopEntryGroupEntries["Categories"]?.value;
    const categories = Array.isArray(categoriesValue) ? categoriesValue : ['Others'];

    let assignedCategory = categories[0] ?? 'Others';

    const entry: DesktopEntry = {
      key: fileName,
      name: desktopEntryGroupEntries["Name"]?.value,
      kind: parseDesktopEntryKind(desktopEntryGroupEntries["Type"]?.value),
      icon: desktopEntryGroupEntries["Icon"]?.value,
      categories: [assignedCategory]
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

const IconFallbackPaths = ["/usr/share/pixmaps", "/usr/share/icons"];

async function parseDesktopEntryIcon(iconString: string): Promise<IDesktopEntryIconData | null> {
  if (!iconString) {
    return null;
  }
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
    ["png"],
    IconFallbackPaths
  );
  if (pngPath) {
    return await readIconAsync(pngPath);
  }

  return null;
}

async function readIconAsync(iconPath: string): Promise<IDesktopEntryIconData | null> {
  log("Reading icon path: " + iconPath);
  switch (extname(iconPath).toLowerCase()) {
    case ".png":
      {
        const fileBytes = await readFile(iconPath);
        return {
          data: fileBytes,
          mimeType: "image/png",
        };
        // return "data:image/png;base64," + encodeArrayBufferToBase64(fileBytes);
      }
      break;
    case ".svg":
      {
        const fileBytes = await readFile(iconPath);
        return {
          data: fileBytes,
          mimeType: "image/svg+xml",
        };
        // return "data:image/svg+xml;base64," + encodeArrayBufferToBase64(fileBytes);
      }
      break;
  }
  return null;
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
