/** Names of virtual desktops. */
export const TAG_NAMES = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function getTagNames(): string[] {
  return TAG_NAMES.slice();
}

export function getFirstTagName(): string {
  return TAG_NAMES[0];
}
