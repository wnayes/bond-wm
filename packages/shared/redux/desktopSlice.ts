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
  categories?: string[];
}

export interface DesktopEntryMap {
  [key: string]: DesktopEntry;
}

interface IDesktopSlice {
  /** Metadata for all .desktop files on the system. */
  entries: DesktopEntryMap;

  /** Metadata for .desktop files that are shown as icons on the desktop. */
  desktopEntries: DesktopEntryMap;
}

const initialState: IDesktopSlice = { entries: {}, desktopEntries: {} };

export const desktopSlice = createSlice({
  name: "desktop",
  initialState,
  reducers: {
    setEntries: (state, { payload }: PayloadAction<DesktopEntryMap>) => {
      state.entries = payload;
    },
    setDesktopEntries: (state, { payload }: PayloadAction<DesktopEntryMap>) => {
      state.desktopEntries = payload;
    },
  },
});

export const { setEntries, setDesktopEntries } = desktopSlice.actions;

export default desktopSlice.reducer;
