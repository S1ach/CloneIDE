"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import {
  X,
  Command,
  Files,
  Search,
  Settings,
  Save,
  Terminal,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import { updateContent, findNodeById } from "@/entities/file/model/files.slice";
import {
  closeTab,
  setActiveTab,
  reorderTabs,
  openTab,
} from "@/entities/tab/model/tabs.slice";
import {
  updateCursor,
  setLanguage,
  setDirty,
} from "@/entities/editor/model/editor.slice";
import { FileIcon } from "@/widgets/sidebar/ui/FileExplorer";
import { useKeyboardShortcut } from "@/shared/hooks/useKeyboardShortcut";
import { useModKey } from "@/shared/hooks/usePlatform";
import { cn } from "@/shared/lib/cn";

export function getEditorLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
      return "html";
    case "css":
      return "css";
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
}

export function EditorLayout() {
  const dispatch = useAppDispatch();
  const openedTabs = useAppSelector((state) => state.tabs.opened);
  const activeTabId = useAppSelector((state) => state.tabs.active);
  const fileTree = useAppSelector((state) => state.files.tree);

  const mod = useModKey();

  // Editor Settings
  const theme = useAppSelector((state) => state.settings.theme);
  const fontSize = useAppSelector((state) => state.settings.fontSize);
  const wordWrap = useAppSelector((state) => state.settings.wordWrap);
  const minimap = useAppSelector((state) => state.settings.minimap);
  const isDirty = useAppSelector((state) => state.editor.isDirty);
  const cursorLine = useAppSelector((state) => state.editor.cursorLine);
  const cursorColumn = useAppSelector((state) => state.editor.cursorColumn);

  // Drag & Drop state for tab reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropSide, setDropSide] = useState<"left" | "right">("left");
  const dragCounterRef = useRef(0);

  // Drag from explorer state
  const [explorerDragOver, setExplorerDragOver] = useState(false);

  // Retrieve details of the currently active file
  const activeFile = activeTabId ? findNodeById(fileTree, activeTabId) : null;

  // Local state for the text editor value to handle immediate text changes
  const [editorValue, setEditorValue] = useState("");

  // Sync editorValue whenever the active file changes
  useEffect(() => {
    if (activeFile) {
      setEditorValue(activeFile.content);
      dispatch(setLanguage(getEditorLanguage(activeFile.name)));
      dispatch(setDirty(false));
    }
  }, [activeTabId, activeFile?.id]);

  // Bind custom key Ctrl+S or Cmd+S for fake save indicator
  useKeyboardShortcut({ key: "s", ctrl: true }, () => handleSave());
  useKeyboardShortcut({ key: "s", meta: true }, () => handleSave());

  // Bind Ctrl+W or Alt+W to close active tab
  useKeyboardShortcut({ key: "w", ctrl: true }, () => handleCloseActive());
  useKeyboardShortcut({ key: "w", alt: true }, () => handleCloseActive());

  const handleSave = () => {
    if (activeFile) {
      dispatch(updateContent({ id: activeFile.id, content: editorValue }));
      dispatch(setDirty(false));
      // Log to terminal mock
      const logMsg = `[info] File saved and compiled: ${activeFile.path}`;
      // Import the addLog dynamically or handle it
      // dispatch(addLog(logMsg)) will be handled below by importing slice action
    }
  };

  const handleCloseActive = () => {
    if (activeTabId) {
      dispatch(closeTab(activeTabId));
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const newVal = value ?? "";
    setEditorValue(newVal);
    dispatch(setDirty(true));

    // Live update content immediately (no debounce needed since RTK is highly optimized client-side)
    if (activeFile) {
      dispatch(updateContent({ id: activeFile.id, content: newVal }));
    }
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    // Track cursor movements
    editor.onDidChangeCursorPosition((e: any) => {
      dispatch(
        updateCursor({
          line: e.position.lineNumber,
          column: e.position.column,
        }),
      );
    });
  };

  // Drag event handlers for tab reordering
  const handleTabDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    // Make drag ghost slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  }, []);

  const handleTabDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  }, []);

  const handleTabDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Determine drop side based on mouse position within the tab
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    setDropSide(e.clientX < midX ? "left" : "right");
    setDragOverIndex(index);
  }, []);

  const handleTabDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounterRef.current++;
    setDragOverIndex(index);
  }, []);

  const handleTabDragLeave = useCallback((e: React.DragEvent) => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOverIndex(null);
    }
  }, []);

  const handleTabDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = draggedIndex;
    if (fromIndex !== null && fromIndex !== toIndex) {
      // Adjust target index based on drop side
      let adjustedTo = toIndex;
      if (dropSide === "right" && toIndex > fromIndex) {
        adjustedTo = toIndex;
      } else if (dropSide === "right" && toIndex < fromIndex) {
        adjustedTo = toIndex + 1;
      } else if (dropSide === "left" && toIndex > fromIndex) {
        adjustedTo = toIndex - 1;
      }
      // Clamp
      adjustedTo = Math.max(0, Math.min(adjustedTo, openedTabs.length - 1));
      if (adjustedTo !== fromIndex) {
        dispatch(reorderTabs({ fromIndex, toIndex: adjustedTo }));
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  }, [draggedIndex, dropSide, openedTabs.length, dispatch]);

  // --- Handlers for accepting file drops from the Explorer sidebar ---
  const isExplorerDrag = useCallback((e: React.DragEvent) => {
    return e.dataTransfer.types.includes("application/x-file-node-id");
  }, []);

  const handleExplorerDragOver = useCallback((e: React.DragEvent) => {
    if (!isExplorerDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setExplorerDragOver(true);
  }, [isExplorerDrag]);

  const handleExplorerDragLeave = useCallback((e: React.DragEvent) => {
    if (!isExplorerDrag(e)) return;
    setExplorerDragOver(false);
  }, [isExplorerDrag]);

  const handleExplorerDrop = useCallback((e: React.DragEvent) => {
    const fileId = e.dataTransfer.getData("application/x-file-node-id");
    if (!fileId) return;
    e.preventDefault();
    e.stopPropagation();
    setExplorerDragOver(false);
    dispatch(openTab(fileId));
  }, [dispatch]);

  return (
    <div className="h-full w-full bg-bg-editor flex flex-col overflow-hidden">
      {/* File tab headers */}
      {openedTabs.length > 0 ? (
        <div
          className={cn(
            "flex h-9 w-full bg-bg-panel border-b border-border-primary overflow-x-auto select-none scrollbar-none shrink-0",
            explorerDragOver && "ring-2 ring-inset ring-accent-primary/50 bg-accent-muted/10"
          )}
          onDragOver={handleExplorerDragOver}
          onDragLeave={handleExplorerDragLeave}
          onDrop={handleExplorerDrop}
        >
          {openedTabs.map((tabId, index) => {
            const file = findNodeById(fileTree, tabId);
            if (!file) return null;
            const isActive = tabId === activeTabId;
            const isDragging = draggedIndex === index;
            const isDropTarget = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;

            return (
              <div
                key={tabId}
                draggable
                onDragStart={(e) => handleTabDragStart(e, index)}
                onDragEnd={handleTabDragEnd}
                onDragOver={(e) => handleTabDragOver(e, index)}
                onDragEnter={(e) => handleTabDragEnter(e, index)}
                onDragLeave={handleTabDragLeave}
                onDrop={(e) => handleTabDrop(e, index)}
                onClick={() => dispatch(setActiveTab(tabId))}
                className={cn(
                  "flex items-center px-5 h-full border-r border-border-primary cursor-grab text-xs font-medium transition-all relative shrink-0",
                  isActive
                    ? "bg-bg-editor text-text-primary border-t-2 border-t-accent-primary"
                    : "bg-tab-inactive text-text-secondary hover:text-text-primary hover:bg-hover-bg",
                  isDragging && "opacity-50",
                )}
                style={{ gap: 10 }}
              >
                {/* Left drop indicator */}
                {isDropTarget && dropSide === "left" && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-accent-primary z-10 animate-pulse" />
                )}

                <FileIcon
                  name={file.name}
                  className="h-3.5 w-3.5"
                />
                <span className="max-w-[120px] truncate">{file.name}</span>
                {isActive && isDirty && (
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-primary shrink-0" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(closeTab(tabId));
                  }}
                  className="p-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Right drop indicator */}
                {isDropTarget && dropSide === "right" && (
                  <span className="absolute right-0 top-1 bottom-1 w-0.5 rounded-full bg-accent-primary z-10 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Editor Space */}
      <div className="flex-1 min-h-0 w-full relative">
        {activeFile ? (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 min-h-0 w-full relative">
              <Editor
                height="100%"
                theme={theme === "dark" ? "vs-dark" : "light"}
                language={getEditorLanguage(activeFile.name)}
                value={editorValue}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  fontSize,
                  wordWrap: wordWrap ? "on" : "off",
                  minimap: { enabled: minimap },
                  automaticLayout: true,
                  fontFamily:
                    "var(--font-mono), Menlo, Monaco, Courier New, monospace",
                  tabSize: 2,
                  padding: { top: 12 },
                  lineNumbersMinChars: 3,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                }}
              />
            </div>
            {/* Editor Footer / Info panel */}
            <div className="h-6 w-full border-t border-border-primary bg-bg-panel px-4 flex items-center justify-between text-[10px] text-text-secondary select-none font-medium shrink-0">
              <div className="flex items-center gap-4">
                <span>
                  Language: {getEditorLanguage(activeFile.name).toUpperCase()}
                </span>
                {isDirty && (
                  <span className="flex items-center gap-1 text-accent-primary animate-pulse">
                    <Save className="h-3 w-3" /> Unsaved Changes
                  </span>
                )}
              </div>
              <div className="font-mono">
                Ln {cursorLine}, Col {cursorColumn}
              </div>
            </div>
          </div>
        ) : (
          /* Blank screen showing keyboard shortcut lists when no tabs are open */
          <div
            className={cn(
              "h-full w-full flex flex-col items-center justify-center bg-bg-editor p-8 text-center select-none animate-in fade-in duration-300",
              explorerDragOver && "ring-2 ring-inset ring-accent-primary/40 bg-accent-muted/5"
            )}
            onDragOver={handleExplorerDragOver}
            onDragLeave={handleExplorerDragLeave}
            onDrop={handleExplorerDrop}
          >
            <div className="max-w-md space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-accent-muted p-4 text-accent-primary">
                  <Command className="h-10 w-10 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-text-primary">
                  Welcome to CodeSandbox Clone
                </h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Open a file from the explorer sidebar or create a new file to
                  start writing code in Monaco Editor!
                </p>
              </div>

              {/* Keyboard Shortcuts List */}
              <div className="border border-border-primary rounded-xl p-4 bg-bg-panel text-left space-y-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block border-b border-border-primary pb-1.5">
                  Keyboard Shortcuts
                </span>

                <div className="flex justify-between items-center text-xs text-text-primary">
                  <span className="text-text-secondary flex items-center gap-2">
                    <Command className="h-3.5 w-3.5" /> Command Palette
                  </span>
                  <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                    {mod} Shift P
                  </kbd>
                </div>

                <div className="flex justify-between items-center text-xs text-text-primary">
                  <span className="text-text-secondary flex items-center gap-2">
                    <Search className="h-3.5 w-3.5" /> Quick Open File
                  </span>
                  <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                    {mod} P
                  </kbd>
                </div>

                <div className="flex justify-between items-center text-xs text-text-primary">
                  <span className="text-text-secondary flex items-center gap-2">
                    <Files className="h-3.5 w-3.5" /> File Explorer
                  </span>
                  <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                    {mod} Shift E
                  </kbd>
                </div>

                <div className="flex justify-between items-center text-xs text-text-primary">
                  <span className="text-text-secondary flex items-center gap-2">
                    <Search className="h-3.5 w-3.5" /> Search in Files
                  </span>
                  <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                    {mod} Shift F
                  </kbd>
                </div>

                <div className="flex justify-between items-center text-xs text-text-primary">
                  <span className="text-text-secondary flex items-center gap-2">
                    <Save className="h-3.5 w-3.5" /> Save & Compile
                  </span>
                  <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                    {mod} S
                  </kbd>
                </div>

                <div className="flex justify-between items-center text-xs text-text-primary">
                  <span className="text-text-secondary flex items-center gap-2">
                    <X className="h-3.5 w-3.5" /> Close Active Tab
                  </span>
                  <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                    {mod} W
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
