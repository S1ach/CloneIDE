export interface FileNode {
  id: string;
  name: string;
  path: string;
  content: string; // If folder, content is usually empty
  type: "file" | "folder";
  children?: FileNode[];
}
