"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit2,
  FileText,
  Code2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import {
  createNode,
  deleteNode,
  renameNode,
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
  switch (ext) {
    case "html":
      return (
        <Code2
          className={cn("h-4 w-4 text-orange-500", className)}
          style={style}
        />
      );
    case "css":
      return (
        <FileText
          className={cn("h-4 w-4 text-blue-400", className)}
          style={style}
        />
      );
    case "js":
    case "jsx":
      return (
        <FileText
          className={cn("h-4 w-4 text-yellow-500", className)}
          style={style}
        />
      );
    case "ts":
    case "tsx":
      return (
        <FileText
          className={cn("h-4 w-4 text-sky-500", className)}
          style={style}
        />
      );
    case "md":
      return (
        <FileText
          className={cn("h-4 w-4 text-emerald-400", className)}
          style={style}
        />
      );
    case "json":
      return (
        <File
          className={cn("h-4 w-4 text-yellow-600", className)}
          style={style}
        />
      );
    default:
      return (
        <File
          className={cn("h-4 w-4 text-text-secondary", className)}
          style={style}
        />
      );
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

  // For handling click-away or escape to cancel inline creation/renaming
  const handleCancelInput = () => {
    dispatch(setCreationNode(null));
    dispatch(setEditingNodeId(null));
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
              className="group flex w-full items-center justify-between py-1.5 pr-2 hover:bg-hover-bg cursor-pointer select-none rounded-md transition-colors"
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
              onClick={handleNodeClick}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {isFolder ? (
                  <span className="text-text-secondary shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                ) : (
                  <span className="w-4 shrink-0" />
                )}

                {isFolder ? (
                  isExpanded ? (
                    <FolderOpen
                      className="h-4 w-4 text-amber-400 shrink-0"
                      style={{ marginRight: 5 }}
                    />
                  ) : (
                    <Folder
                      className="h-4 w-4 text-amber-500 shrink-0"
                      style={{ marginRight: 5 }}
                    />
                  )
                ) : (
                  <FileIcon
                    name={node.name}
                    className="shrink-0"
                    style={{ marginRight: 5 }}
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
                  <span className="text-xs truncate font-medium text-text-primary">
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
          <div className="flex flex-col">
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
        className="flex items-center gap-2 py-1 pr-2 rounded-md"
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        <span className="w-4 shrink-0" />
        {type === "folder" ? (
          <Folder
            className="h-4 w-4 text-amber-500 shrink-0"
            style={{ marginRight: 5 }}
          />
        ) : (
          <File
            className="h-4 w-4 text-text-secondary shrink-0"
            style={{ marginRight: 5 }}
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
      className="flex h-full w-full flex-col px-3 py-2"
      onClick={handleCancelInput}
    >
      {/* File Explorer Title and Actions */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">
          Workspace
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(setCreationNode({ parentId: null, type: "file" }));
            }}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg"
            title="New file in workspace root"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(setCreationNode({ parentId: null, type: "folder" }));
            }}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg"
            title="New folder in workspace root"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Files Tree */}
      <div className="flex-1 overflow-y-auto space-y-0.5">
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
    </div>
  );
}
