import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface BrowserTabData {
  url: string;
  title: string;
}

interface TabsState {
  opened: string[];
  active: string | null;
  browserTabs: Record<string, BrowserTabData>;
}

const initialState: TabsState = {
  opened: ["6", "1"], // Start with README.md and index.html open
  active: "6", // README.md is active initially
  browserTabs: {},
};

const tabsSlice = createSlice({
  name: "tabs",
  initialState,
  reducers: {
    openTab(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (!state.opened.includes(id)) {
        state.opened.push(id);
      }
      state.active = id;
    },
    closeTab(state, action: PayloadAction<string>) {
      const id = action.payload;
      const index = state.opened.indexOf(id);
      if (index !== -1) {
        state.opened.splice(index, 1);
      }

      // Clean up browser tab data if it was a browser tab
      if (state.browserTabs[id]) {
        delete state.browserTabs[id];
      }

      if (state.active === id) {
        if (state.opened.length > 0) {
          // Set active to the tab next to the closed one, or the last one
          const nextActiveIndex = Math.min(index, state.opened.length - 1);
          state.active = state.opened[nextActiveIndex];
        } else {
          state.active = null;
        }
      }
    },
    setActiveTab(state, action: PayloadAction<string>) {
      state.active = action.payload;
    },
    reorderTabs(
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>,
    ) {
      const { fromIndex, toIndex } = action.payload;
      if (
        fromIndex >= 0 &&
        fromIndex < state.opened.length &&
        toIndex >= 0 &&
        toIndex < state.opened.length
      ) {
        const [moved] = state.opened.splice(fromIndex, 1);
        state.opened.splice(toIndex, 0, moved);
      }
    },
    openBrowserTab(
      state,
      action: PayloadAction<{ url: string; title?: string }>,
    ) {
      const { url, title } = action.payload;
      const id = `browser-${Date.now()}`;
      state.browserTabs[id] = {
        url,
        title: title || new URL(url).hostname,
      };
      state.opened.push(id);
      state.active = id;
    },
    updateBrowserTab(
      state,
      action: PayloadAction<{ id: string; url?: string; title?: string }>,
    ) {
      const { id, url, title } = action.payload;
      if (state.browserTabs[id]) {
        if (url !== undefined) state.browserTabs[id].url = url;
        if (title !== undefined) state.browserTabs[id].title = title;
      }
    },
  },
});

export const {
  openTab,
  closeTab,
  setActiveTab,
  reorderTabs,
  openBrowserTab,
  updateBrowserTab,
} = tabsSlice.actions;
export const tabsReducer = tabsSlice.reducer;
