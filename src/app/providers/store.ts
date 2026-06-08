import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

import { filesReducer } from "@/entities/file/model/files.slice";
import { editorReducer } from "@/entities/editor/model/editor.slice";
import { tabsReducer } from "@/entities/tab/model/tabs.slice";
import { terminalReducer } from "@/entities/terminal/model/terminal.slice";
import { explorerReducer } from "@/entities/explorer/model/explorer.slice";
import { settingsReducer } from "@/entities/settings/model/settings.slice";
import { historyReducer } from "@/entities/history/model/history.slice";

export const store = configureStore({
  reducer: {
    files: filesReducer,
    editor: editorReducer,
    tabs: tabsReducer,
    terminal: terminalReducer,
    explorer: explorerReducer,
    settings: settingsReducer,
    history: historyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for state consumption
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected>(
  selector: (state: RootState) => TSelected,
) => useSelector<RootState, TSelected>(selector);
