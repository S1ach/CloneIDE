import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TabsState {
  opened: string[];
  active: string | null;
}

const initialState: TabsState = {
  opened: ["6", "1"], // Start with README.md and index.html open
  active: "6", // README.md is active initially
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
  },
});

export const { openTab, closeTab, setActiveTab, reorderTabs } =
  tabsSlice.actions;
export const tabsReducer = tabsSlice.reducer;
