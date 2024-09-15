import { env } from "node:process";
import { join } from "node:path";
import { existsSync } from "node:fs";
const getXdgUserDirs = require("xdg-user-dir");

interface UserDirs {
  XDG_DESKTOP_DIR: string;
  XDG_DOWNLOAD_DIR: string;
  XDG_TEMPLATES_DIR: string;
  XDG_PUBLICSHARE_DIR: string;
  XDG_DOCUMENTS_DIR: string;
  XDG_MUSIC_DIR: string;
  XDG_PICTURES_DIR: string;
  XDG_VIDEOS_DIR: string;
}

let _userDirs: UserDirs | null = null;

/**
 * Gets the XDG Config Home directory.
 * Usually ~/.config
 */
export function getXDGConfigHome(): string {
  let XDG_CONFIG_HOME = env["XDG_CONFIG_HOME"];
  if (!XDG_CONFIG_HOME) {
    const HOME = env["HOME"] || "~";
    XDG_CONFIG_HOME = join(HOME, ".config");
  }
  return XDG_CONFIG_HOME;
}

/** Different kinds of XDG user directories. */
export enum UserDirectoryKind {
  Desktop,
  Documents,
  Download,
  Music,
  Pictures,
  PublicShare,
  Templates,
  Videos,
}

/**
 * Retrieves an XDG user directory.
 * @returns String directory path, or null if the directory doesn't exist.
 */
export async function getXDGUserDirectory(kind: UserDirectoryKind): Promise<string | null> {
  if (!_userDirs) {
    _userDirs = await getXdgUserDirs();
  }

  let dir;
  switch (kind) {
    case UserDirectoryKind.Desktop:
      dir = _userDirs?.XDG_DESKTOP_DIR ?? null;
      break;
    case UserDirectoryKind.Documents:
      dir = _userDirs?.XDG_DOCUMENTS_DIR ?? null;
      break;
    case UserDirectoryKind.Download:
      dir = _userDirs?.XDG_DOWNLOAD_DIR ?? null;
      break;
    case UserDirectoryKind.Music:
      dir = _userDirs?.XDG_MUSIC_DIR ?? null;
      break;
    case UserDirectoryKind.Pictures:
      dir = _userDirs?.XDG_PICTURES_DIR ?? null;
      break;
    case UserDirectoryKind.PublicShare:
      dir = _userDirs?.XDG_PUBLICSHARE_DIR ?? null;
      break;
    case UserDirectoryKind.Templates:
      dir = _userDirs?.XDG_TEMPLATES_DIR ?? null;
      break;
    case UserDirectoryKind.Videos:
      dir = _userDirs?.XDG_VIDEOS_DIR ?? null;
      break;
    default:
      throw new Error("Unknown XDG user directory kind");
  }

  if (dir && !existsSync(dir)) {
    dir = null;
  }
  return dir;
}
