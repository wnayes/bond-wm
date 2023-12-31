import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum DesktopEntryKind {
  Application,
  Directory,
  Link,
}

export interface DesktopEntry {
  key: string;
  name: string;
  kind: DesktopEntryKind;
  target?: string;
  icon?: string;
  workingDirectory?: string;
}

export interface DesktopEntryMap {
  [key: string]: DesktopEntry;
}

interface IDesktopSlice {
  entries: DesktopEntryMap;
}

export const desktopSlice = createSlice({
  name: "desktop",
  initialState: { entries: {} } as IDesktopSlice,
  reducers: {
    setDesktopEntries: (state, { payload }: PayloadAction<DesktopEntryMap>) => {
      state.entries = payload;
    },
  },
});

export const { setDesktopEntries } = desktopSlice.actions;

export default desktopSlice.reducer;
