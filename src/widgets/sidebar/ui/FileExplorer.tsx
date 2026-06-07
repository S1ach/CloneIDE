"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit2,
  Upload,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import {
  createNode,
  deleteNode,
  renameNode,
  uploadFiles,
} from "@/entities/file/model/files.slice";
import {
  toggleFolder,
  setCreationNode,
  setEditingNodeId,
} from "@/entities/explorer/model/explorer.slice";
import { openTab, closeTab } from "@/entities/tab/model/tabs.slice";
import { FileNode } from "@/entities/file/types";
import { cn } from "@/shared/lib/cn";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/shared/ui/ContextMenu";

// Seti-inspired clean flat file icons
function HtmlIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="#E34F26" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function CssIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="#3C9CD7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function JsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" fill="#F5C211" />
      <path d="M7 15C7 16.5 8 17.5 10 17.5C12 17.5 12.5 16 12.5 14.5V8.5H10.5V14.5C10.5 15.2 10.2 15.5 9.8 15.5C9.4 15.5 9 15.2 9 14.5H7V15ZM13.5 15.5H15.5C15.5 16 15.8 16.3 16.3 16.3C16.8 16.3 17.1 16 17.1 15.5C17.1 14.8 16.5 14.5 15.5 14.2L14.8 13.9C13.5 13.4 12.8 12.6 12.8 11.2C12.8 9.6 14.1 8.5 16.1 8.5C18.1 8.5 19.1 9.5 19.1 11.1H17.1C17.1 10.4 16.7 10.1 16.1 10.1C15.5 10.1 15.1 10.4 15.1 10.9C15.1 11.5 15.5 11.8 16.5 12.2L17.2 12.5C18.5 13 19.3 13.8 19.3 15.3C19.3 16.8 18.3 17.9 16.3 17.9C14.3 17.9 13.5 16.7 13.5 15.5Z" fill="#1e1e20" />
    </svg>
  );
}

function TsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" fill="#3178C6" />
      <path d="M2.5 10.5H5.5V17.5H7.5V10.5H10.5V8.5H2.5V10.5ZM17 15.5C17 16 17.3 16.3 17.8 16.3C18.3 16.3 18.6 16 18.6 15.5C18.6 14.8 18 14.5 17 14.2L16.3 13.9C15 13.4 14.3 12.6 14.3 11.2C14.3 9.6 15.6 8.5 17.6 8.5C19.6 8.5 20.6 9.5 20.6 11.1H18.6C18.6 10.4 18.2 10.1 17.6 10.1C17 10.1 16.6 10.4 16.6 10.9C16.6 11.5 17 11.8 18 12.2L18.7 12.5C20 13 20.8 13.8 20.8 15.3C20.8 16.8 19.8 17.9 17.8 17.9C15.8 17.9 15 16.7 15 15.5H17Z" fill="white" />
    </svg>
  );
}

function ReactIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="-11.5 -10.23174 23 20.46348" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="0" cy="0" r="2.05" fill="#51BCE3" />
      <g stroke="#51BCE3" strokeWidth="1.2" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

function MarkdownIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="#41535b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#519aba" />
      <path d="M7 15V9l2.5 3L12 9v6" stroke="#519aba" />
      <path d="M17 12V9m0 3l2-2m-2 2l-2-2" stroke="#519aba" />
    </svg>
  );
}

function JsonIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="#CBCB41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
      <path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

function GitIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="#E34F26" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 15V9a4 4 0 0 0-4-4H9" />
      <line x1="6" y1="9" x2="6" y2="15" />
    </svg>
  );
}

function SvgIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="#009688" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function LockIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ConfigIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="#90A4AE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function DefaultFileIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" fill="currentColor" fillOpacity="0.05" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

// Helper to render customized file icons based on extension
export function FileIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ext = name.split(".").pop()?.toLowerCase();
  const lowerName = name.toLowerCase();
  const iconClass = cn("h-4 w-4 shrink-0", className);

  // Exact file name matches
  if (lowerName === ".gitignore" || lowerName === ".gitattributes") {
    return <GitIcon className={iconClass} style={style} />;
  }
  if (lowerName === "yarn.lock" || lowerName === "package-lock.json") {
    return <LockIcon className={iconClass} style={style} />;
  }
  if (lowerName === ".env" || lowerName.startsWith(".env.") || lowerName === ".editorconfig") {
    return <ConfigIcon className={iconClass} style={style} />;
  }

  // Extension matches
  switch (ext) {
    case "html":
      return <HtmlIcon className={iconClass} style={style} />;
    case "css":
      return <CssIcon className={iconClass} style={style} />;
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return <ReactIcon className={iconClass} style={style} />;
    case "json":
      return <JsonIcon className={iconClass} style={style} />;
    case "md":
      return <MarkdownIcon className={iconClass} style={style} />;
    case "svg":
      return <SvgIcon className={iconClass} style={style} />;
    default:
      return <DefaultFileIcon className={cn("text-text-secondary", iconClass)} style={style} />;
  }
}

export function FileExplorer() {
  const dispatch = useAppDispatch();
  const fileTree = useAppSelector((state) => state.files.tree);
  const expandedFolders = useAppSelector(
    (state) => state.explorer.expandedFolders,
  );
  const creationNode = useAppSelector((state) => state.explorer.creationNode);
  const editingNodeId = useAppSelector((state) => state.explorer.editingNodeId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetParentId, setUploadTargetParentId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // For handling click-away or escape to cancel inline creation/renaming
  const handleCancelInput = () => {
    dispatch(setCreationNode(null));
    dispatch(setEditingNodeId(null));
  };

  // Read files and dispatch uploadFiles action
  const processFiles = (files: FileList | File[], parentId: string | null) => {
    const fileArray = Array.from(files);
    const results: { parentId: string | null; name: string; content: string }[] = [];
    let processed = 0;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        results.push({
          parentId,
          name: file.name,
          content: reader.result as string,
        });
        processed++;
        if (processed === fileArray.length) {
          dispatch(uploadFiles(results));
        }
      };
      reader.onerror = () => {
        processed++;
        if (processed === fileArray.length && results.length > 0) {
          dispatch(uploadFiles(results));
        }
      };
      reader.readAsText(file);
    });
  };

  const handleUploadClick = (parentId: string | null) => {
    setUploadTargetParentId(parentId);
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files, uploadTargetParentId);
    }
    // Reset the input so the same file can be re-uploaded
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files, null);
    }
  };

  // Render a single node in the tree recursively
  const RenderNode = ({
    node,
    depth = 0,
  }: {
    node: FileNode;
    depth: number;
  }) => {
    const isFolder = node.type === "folder";
    const isExpanded = expandedFolders.includes(node.id);
    const isEditing = editingNodeId === node.id;
    const [editName, setEditName] = useState(node.name);
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isEditing && editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, [isEditing]);

    const handleNodeClick = () => {
      if (isFolder) {
        dispatch(toggleFolder(node.id));
      } else {
        dispatch(openTab(node.id));
      }
    };

    const handleRenameSubmit = () => {
      const trimmed = editName.trim();
      if (trimmed && trimmed !== node.name) {
        dispatch(renameNode({ id: node.id, name: trimmed }));
      }
      dispatch(setEditingNodeId(null));
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRenameSubmit();
      } else if (e.key === "Escape") {
        setEditName(node.name);
        dispatch(setEditingNodeId(null));
      }
    };

    const handleCreateNodeAction = (type: "file" | "folder") => {
      if (!isExpanded) {
        dispatch(toggleFolder(node.id));
      }
      dispatch(setCreationNode({ parentId: node.id, type }));
    };

    const handleDeleteNodeAction = () => {
      dispatch(deleteNode(node.id));
      dispatch(closeTab(node.id));
    };

    return (
      <div className="w-full">
        {/* Context Menu for right-click on nodes */}
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              draggable={!isFolder}
              onDragStart={(e) => {
                if (isFolder) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.setData("application/x-file-node-id", node.id);
                e.dataTransfer.effectAllowed = "copyMove";
              }}
              className={cn(
                "group flex w-full items-center justify-between py-1 hover:bg-hover-bg select-none rounded-md transition-colors",
                isFolder ? "cursor-pointer" : "cursor-grab"
              )}
              style={{ paddingLeft: "4px" }}
              onClick={handleNodeClick}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                {isFolder ? (
                  <span className="text-text-secondary shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </span>
                ) : (
                  <span className="w-3.5 shrink-0" />
                )}

                {!isFolder && (
                  <FileIcon
                    name={node.name}
                    className="h-4 w-4 shrink-0"
                  />
                )}

                {isEditing ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleRenameKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-input-bg text-text-primary text-xs border border-accent-primary px-1 rounded outline-none"
                  />
                ) : (
                  <span className={cn(
                    "text-xs truncate font-medium",
                    isFolder ? "text-text-secondary" : "text-text-primary"
                  )}>
                    {node.name}
                  </span>
                )}
              </div>

              {/* Hover shortcut buttons */}
              {!isEditing && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity duration-150">
                  {isFolder && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateNodeAction("file");
                        }}
                        className="p-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg"
                        title="New File"
                      >
                        <FilePlus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateNodeAction("folder");
                        }}
                        className="p-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg"
                        title="New Folder"
                      >
                        <FolderPlus className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNodeAction();
                    }}
                    className="p-0.5 rounded text-text-secondary hover:text-red-500 hover:bg-hover-bg"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent>
            {isFolder && (
              <>
                <ContextMenuItem onClick={() => handleCreateNodeAction("file")}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  New File
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleCreateNodeAction("folder")}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleUploadClick(node.id)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem
              onClick={() => dispatch(setEditingNodeId(node.id))}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem
              onClick={handleDeleteNodeAction}
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Render child tree if expanded */}
        {isFolder && isExpanded && (
          <div className={cn(
            "flex flex-col border-l border-border-primary/20 mt-0.5",
            depth === 0 ? "ml-[7px] pl-[8px]" : "ml-[11px] pl-[8px]"
          )}>
            {node.children?.map((child) => (
              <RenderNode key={child.id} node={child} depth={depth + 1} />
            ))}

            {/* Render inline creation inputs inside this directory */}
            {creationNode && creationNode.parentId === node.id && (
              <InlineCreationInput
                parentId={node.id}
                type={creationNode.type}
                depth={depth + 1}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  // Input for adding file/folder inline
  const InlineCreationInput = ({
    parentId,
    type,
    depth,
  }: {
    parentId: string | null;
    type: "file" | "folder";
    depth: number;
  }) => {
    const [name, setName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const handleSubmit = () => {
      const trimmed = name.trim();
      if (trimmed) {
        dispatch(createNode({ parentId, name: trimmed, type }));
      }
      dispatch(setCreationNode(null));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "Escape") {
        dispatch(setCreationNode(null));
      }
    };

    return (
      <div
        className="flex items-center gap-1.5 py-1 pr-2 rounded-md"
        style={{ paddingLeft: "4px" }}
      >
        <span className="w-3.5 shrink-0" />
        {type === "folder" ? (
          <ChevronRight className="h-3.5 w-3.5 text-text-secondary shrink-0" />
        ) : (
          <FileIcon
            name={name || "file"}
            className="h-4 w-4 shrink-0"
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          placeholder={type === "file" ? "file name" : "folder name"}
          className="w-full bg-input-bg text-text-primary text-xs border border-accent-primary px-1.5 py-0.5 rounded outline-none"
        />
      </div>
    );
  };

  return (
    <div
      className={`flex h-full w-full flex-col px-3 py-2 transition-colors duration-200 ${isDragOver ? "bg-accent-primary/10 ring-2 ring-inset ring-accent-primary/40 rounded-lg" : ""
        }`}
      onClick={handleCancelInput}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* File Explorer Title and Actions */}
      <div className="flex items-center justify-between mb-4 select-none px-1">
        <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">
          Workspace
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUploadClick(null);
            }}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
            title="Upload files to workspace root"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(setCreationNode({ parentId: null, type: "file" }));
            }}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
            title="New file in workspace root"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(setCreationNode({ parentId: null, type: "folder" }));
            }}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
            title="New folder in workspace root"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Files Tree */}
      <div className="flex-1 overflow-y-auto space-y-0.5 border-l border-border-primary/15 pl-[6px] mt-1">
        {fileTree.map((node) => (
          <RenderNode key={node.id} node={node} depth={0} />
        ))}

        {/* Render inline creation inputs in root folder */}
        {creationNode && creationNode.parentId === null && (
          <InlineCreationInput
            parentId={null}
            type={creationNode.type}
            depth={0}
          />
        )}

        {fileTree.length === 0 && !creationNode && (
          <div className="text-center text-xs text-text-secondary py-4">
            Workspace is empty. Create a file to get started!
          </div>
        )}
      </div>

      {/* Drag-and-drop overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center gap-2 text-accent-primary animate-pulse">
            <Upload className="h-8 w-8" />
            <span className="text-xs font-semibold tracking-wide">Drop files here</span>
          </div>
        </div>
      )}
    </div>
  );
}
