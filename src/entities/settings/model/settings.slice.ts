import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Theme = "dark" | "light";

interface SettingsState {
  theme: Theme;
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
}

const initialState: SettingsState = {
  theme: "dark",
  fontSize: 14,
  wordWrap: true,
  minimap: false,
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
  },
});

export const { setTheme, setFontSize, toggleWordWrap, toggleMinimap } =
  settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
