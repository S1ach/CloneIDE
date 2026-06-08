import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HistoryRecord } from "../types";

interface HistoryState {
  records: Record<string, HistoryRecord[]>; // fileId -> history records sorted newest first
  selectedRecordId: string | null; // record currently viewed in diff
  diffActive: boolean; // is diff mode active?
}

const initialState: HistoryState = {
  records: {},
  selectedRecordId: null,
  diffActive: false,
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    addRecord(
      state,
      action: PayloadAction<{ fileId: string; content: string }>,
    ) {
      const { fileId, content } = action.payload;
      const fileHistory = state.records[fileId] || [];

      // Avoid duplicate history records with identical content consecutively
      if (fileHistory.length > 0 && fileHistory[0].content === content) {
        return;
      }

      const newRecord: HistoryRecord = {
        id: Math.random().toString(36).substring(7),
        fileId,
        timestamp: Date.now(),
        content,
      };

      state.records[fileId] = [newRecord, ...fileHistory];
    },
    selectRecord(state, action: PayloadAction<string | null>) {
      state.selectedRecordId = action.payload;
      state.diffActive = action.payload !== null;
    },
    clearHistoryForFile(state, action: PayloadAction<string>) {
      state.records[action.payload] = [];
      if (state.selectedRecordId) {
        state.selectedRecordId = null;
        state.diffActive = false;
      }
    },
    setDiffActive(state, action: PayloadAction<boolean>) {
      state.diffActive = action.payload;
      if (!action.payload) {
        state.selectedRecordId = null;
      }
    },
  },
});

export const { addRecord, selectRecord, clearHistoryForFile, setDiffActive } =
  historySlice.actions;
export const historyReducer = historySlice.reducer;
