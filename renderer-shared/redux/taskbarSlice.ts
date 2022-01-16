import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TaskbarState {
  showingRun: boolean;
}

const initialState: TaskbarState = { showingRun: false };

export const taskbarSlice = createSlice({
  name: "taskbar",
  initialState,
  reducers: {
    showRunFieldAction: {
      reducer: (state, { payload }: PayloadAction<boolean>) => {
        state.showingRun = payload;
      },
      prepare: (showing: boolean) => ({
        payload: showing,
        meta: {
          scope: "local",
        },
      }),
    },
  },
});

export const { showRunFieldAction } = taskbarSlice.actions;

export default taskbarSlice.reducer;
