import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Theme = "dark" | "light";
export type EditorTheme =
  | "vs-dark"
  | "light"
  | "cyberpunk"
  | "monokai"
  | "github-light";

export type PreviewTab =
  | { id: string; type: "preview"; title: string }
  | { id: string; type: "url"; title: string; url: string }
  | { id: string; type: "file"; title: string; fileId: string };

interface SettingsState {
  theme: Theme;
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  previewOpen: boolean;
  previewActiveTabId: string;
  previewTabs: PreviewTab[];
  editorTheme: EditorTheme;
}

const initialState: SettingsState = {
  theme: "dark",
  fontSize: 14,
  wordWrap: true,
  minimap: false,
  previewOpen: true,
  previewActiveTabId: "preview",
  previewTabs: [{ id: "preview", type: "preview", title: "Preview" }],
  editorTheme: "vs-dark",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      // Sync editor theme as a default option
      state.editorTheme = action.payload === "dark" ? "vs-dark" : "light";
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
    addPreviewTab(state, action: PayloadAction<PreviewTab>) {
      const existing = state.previewTabs.find((t) => {
        if (t.type === "preview" && action.payload.type === "preview")
          return true;
        if (
          t.type === "url" &&
          action.payload.type === "url" &&
          t.url === action.payload.url
        )
          return true;
        if (
          t.type === "file" &&
          action.payload.type === "file" &&
          t.fileId === action.payload.fileId
        )
          return true;
        return false;
      });
      if (existing) {
        state.previewActiveTabId = existing.id;
      } else {
        state.previewTabs.push(action.payload);
        state.previewActiveTabId = action.payload.id;
      }
    },
    closePreviewTab(state, action: PayloadAction<string>) {
      const id = action.payload;
      const index = state.previewTabs.findIndex((t) => t.id === id);
      if (index !== -1) {
        state.previewTabs.splice(index, 1);
      }
      if (state.previewActiveTabId === id) {
        if (state.previewTabs.length > 0) {
          const nextIndex = Math.min(index, state.previewTabs.length - 1);
          state.previewActiveTabId = state.previewTabs[nextIndex].id;
        } else {
          state.previewActiveTabId = "";
        }
      }
    },
    setPreviewTabs(state, action: PayloadAction<PreviewTab[]>) {
      state.previewTabs = action.payload;
    },
    setEditorTheme(state, action: PayloadAction<EditorTheme>) {
      state.editorTheme = action.payload;
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
  addPreviewTab,
  closePreviewTab,
  setPreviewTabs,
  setEditorTheme,
} = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
