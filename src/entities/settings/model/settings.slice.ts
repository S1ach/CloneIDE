import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Theme = "dark" | "light";

interface SettingsState {
  theme: Theme;
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  previewOpen: boolean;
  previewActiveTabId: string;
}

const initialState: SettingsState = {
  theme: "dark",
  fontSize: 14,
  wordWrap: true,
  minimap: false,
  previewOpen: true,
  previewActiveTabId: "preview",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    setFontSize(state, action: PayloadAction<number>) {
      state.fontSize = action.payload;
    },
    toggleWordWrap(state) {
      state.wordWrap = !state.wordWrap;
    },
    toggleMinimap(state) {
      state.minimap = !state.minimap;
    },
    togglePreview(state) {
      state.previewOpen = !state.previewOpen;
    },
    setPreviewOpen(state, action: PayloadAction<boolean>) {
      state.previewOpen = action.payload;
    },
    setPreviewActiveTabId(state, action: PayloadAction<string>) {
      state.previewActiveTabId = action.payload;
    },
  },
});

export const {
  setTheme,
  setFontSize,
  toggleWordWrap,
  toggleMinimap,
  togglePreview,
  setPreviewOpen,
  setPreviewActiveTabId,
} = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
