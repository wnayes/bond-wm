const _layouts = ["Floating", "Tiling"];

export function getLayoutNames(): string[] {
  return _layouts;
}

export function getFirstLayoutName(): string {
  return _layouts[0];
}

export function getNextLayoutName(fromLayoutName: string): string {
  const currentIndex = _layouts.findIndex((layout) => layout === fromLayoutName);
  const nextIndex = (currentIndex + 1) % _layouts.length;
  return _layouts[nextIndex];
}
