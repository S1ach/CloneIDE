import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EditorState {
  cursorLine: number;
  cursorColumn: number;
  language: string;
  isDirty: boolean;
}

const initialState: EditorState = {
  cursorLine: 1,
  cursorColumn: 1,
  language: "markdown",
  isDirty: false,
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    updateCursor(
      state,
      action: PayloadAction<{ line: number; column: number }>,
    ) {
      state.cursorLine = action.payload.line;
      state.cursorColumn = action.payload.column;
    },
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
    },
    setDirty(state, action: PayloadAction<boolean>) {
      state.isDirty = action.payload;
    },
  },
});

export const { updateCursor, setLanguage, setDirty } = editorSlice.actions;
export const editorReducer = editorSlice.reducer;
