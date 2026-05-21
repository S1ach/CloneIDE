import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CreationState {
  parentId: string | null;
  type: "file" | "folder";
}

export type SidebarView = "explorer" | "search" | "settings";

interface ExplorerState {
  expandedFolders: string[];
  creationNode: CreationState | null;
  editingNodeId: string | null;
  activeView: SidebarView;
}

const initialState: ExplorerState = {
  expandedFolders: ["4"], // Start with "src" expanded
  creationNode: null,
  editingNodeId: null,
  activeView: "explorer",
};

const explorerSlice = createSlice({
  name: "explorer",
  initialState,
  reducers: {
    toggleFolder(state, action: PayloadAction<string>) {
      const id = action.payload;
      const index = state.expandedFolders.indexOf(id);
      if (index !== -1) {
        state.expandedFolders.splice(index, 1);
      } else {
        state.expandedFolders.push(id);
      }
    },
    collapseAll(state) {
      state.expandedFolders = [];
    },
    expandFolder(state, action: PayloadAction<string>) {
      if (!state.expandedFolders.includes(action.payload)) {
        state.expandedFolders.push(action.payload);
      }
    },
    setCreationNode(state, action: PayloadAction<CreationState | null>) {
      state.creationNode = action.payload;
    },
    setEditingNodeId(state, action: PayloadAction<string | null>) {
      state.editingNodeId = action.payload;
    },
    setActiveView(state, action: PayloadAction<SidebarView>) {
      state.activeView = action.payload;
    },
  },
});

export const {
  toggleFolder,
  collapseAll,
  expandFolder,
  setCreationNode,
  setEditingNodeId,
  setActiveView,
} = explorerSlice.actions;
export const explorerReducer = explorerSlice.reducer;
