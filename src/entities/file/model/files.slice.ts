import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FileNode } from "../types";

export const mockFiles: FileNode[] = [
  {
    id: "1",
    name: "index.html",
    path: "/index.html",
    type: "file",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="card">
    <h1>🚀 CodeSandbox Clone</h1>
    <p>Try editing this file, styles.css, or index.js to see live updates!</p>
    <button id="counter-btn">Clicked 0 times</button>
  </div>
  <script src="index.js"></script>
</body>
</html>
`,
  },
  {
    id: "2",
    name: "styles.css",
    path: "/styles.css",
    type: "file",
    content: `body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: linear-gradient(135deg, #0f172a, #1e1b4b);
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2.5rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  max-width: 400px;
  animation: fadeIn 0.8s ease-out;
}

h1 {
  margin-top: 0;
  color: #38bdf8;
  font-size: 2rem;
}

p {
  color: #94a3b8;
  line-height: 1.6;
}

button {
  background: #0971f1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

button:hover {
  background: #1e81ff;
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`,
  },
  {
    id: "3",
    name: "index.js",
    path: "/index.js",
    type: "file",
    content: `// Dynamic interactions inside the sandbox
let count = 0;
const btn = document.getElementById("counter-btn");

if (btn) {
  btn.addEventListener("click", () => {
    count++;
    btn.textContent = \`Clicked \${count} times\`;
    console.log("Button clicked, count is now:", count);
  });
}
`,
  },
  {
    id: "4",
    name: "src",
    path: "/src",
    type: "folder",
    content: "",
    children: [
      {
        id: "5",
        name: "utils.js",
        path: "/src/utils.js",
        type: "file",
        content: `// Utility helper functions
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}
`,
      },
    ],
  },
  {
    id: "6",
    name: "README.md",
    path: "/README.md",
    type: "file",
    content: `# CodeSandbox IDE Clone

This is a web-based client-side IDE clone that implements:
- File tree navigator (add, rename, delete files)
- Tabbed editor panel
- Monaco editor syntax highlighting
- Auto-compiled live preview panel
- Fake interactive terminal panel

Try making changes to the code to see them run in the iframe!
`,
  },
];

interface FilesState {
  tree: FileNode[];
}

const initialState: FilesState = {
  tree: mockFiles,
};

// Recursive helper to insert a node into the tree
const insertNode = (
  nodes: FileNode[],
  parentId: string | null,
  newNode: FileNode,
): boolean => {
  if (parentId === null) {
    nodes.push(newNode);
    return true;
  }
  for (const node of nodes) {
    if (node.id === parentId && node.type === "folder") {
      if (!node.children) node.children = [];
      node.children.push(newNode);
      return true;
    }
    if (node.children) {
      const inserted = insertNode(node.children, parentId, newNode);
      if (inserted) return true;
    }
  }
  return false;
};

// Recursive helper to delete a node from the tree
const deleteNodeFromTree = (nodes: FileNode[], targetId: string): boolean => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === targetId) {
      nodes.splice(i, 1);
      return true;
    }
    if (nodes[i].children) {
      const deleted = deleteNodeFromTree(nodes[i].children!, targetId);
      if (deleted) return true;
    }
  }
  return false;
};

// Recursive helper to rename a node
const renameNodeInTree = (
  nodes: FileNode[],
  targetId: string,
  newName: string,
): boolean => {
  for (const node of nodes) {
    if (node.id === targetId) {
      node.name = newName;
      // Recalculate path
      const parts = node.path.split("/");
      parts[parts.length - 1] = newName;
      node.path = parts.join("/");

      // Update children paths if folder
      if (node.type === "folder" && node.children) {
        updateChildrenPaths(node.children, node.path);
      }
      return true;
    }
    if (node.children) {
      const renamed = renameNodeInTree(node.children, targetId, newName);
      if (renamed) return true;
    }
  }
  return false;
};

// Update paths of child files/directories when a parent directory is renamed
const updateChildrenPaths = (nodes: FileNode[], parentPath: string) => {
  for (const node of nodes) {
    node.path = `${parentPath}/${node.name}`;
    if (node.children) {
      updateChildrenPaths(node.children, node.path);
    }
  }
};

// Recursive helper to find a node by ID
export const findNodeById = (
  nodes: FileNode[],
  targetId: string,
): FileNode | null => {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (node.children) {
      const found = findNodeById(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

// Recursive helper to update content of a file
const updateContentInTree = (
  nodes: FileNode[],
  targetId: string,
  content: string,
): boolean => {
  for (const node of nodes) {
    if (node.id === targetId && node.type === "file") {
      node.content = content;
      return true;
    }
    if (node.children) {
      const updated = updateContentInTree(node.children, targetId, content);
      if (updated) return true;
    }
  }
  return false;
};

const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    createNode(
      state,
      action: PayloadAction<{
        parentId: string | null;
        name: string;
        type: "file" | "folder";
      }>,
    ) {
      const { parentId, name, type } = action.payload;
      const id = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(7);

      let parentPath = "";
      if (parentId) {
        const parent = findNodeById(state.tree, parentId);
        if (parent) {
          parentPath = parent.path;
        }
      }
      const path = `${parentPath}/${name}`;

      const newNode: FileNode = {
        id,
        name,
        path,
        type,
        content: type === "file" ? "" : "",
        children: type === "folder" ? [] : undefined,
      };

      insertNode(state.tree, parentId, newNode);
    },
    deleteNode(state, action: PayloadAction<string>) {
      deleteNodeFromTree(state.tree, action.payload);
    },
    renameNode(state, action: PayloadAction<{ id: string; name: string }>) {
      const { id, name } = action.payload;
      renameNodeInTree(state.tree, id, name);
    },
    updateContent(
      state,
      action: PayloadAction<{ id: string; content: string }>,
    ) {
      const { id, content } = action.payload;
      updateContentInTree(state.tree, id, content);
    },
  },
});

export const { createNode, deleteNode, renameNode, updateContent } =
  filesSlice.actions;
export const filesReducer = filesSlice.reducer;
