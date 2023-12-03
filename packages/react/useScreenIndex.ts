export function useScreenIndex(): number {
  return getScreenIndex();
}

let _screenIndex: number | undefined;

export function setScreenIndex(index: number): void {
  _screenIndex = index;
}

export function getScreenIndex(): number {
  return _screenIndex ?? -1;
}
