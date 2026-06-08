"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Editor, { DiffEditor, Monaco } from "@monaco-editor/react";
import { X, Command, Files, Search, Settings, Save } from "lucide-react";
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
import {
  addRecord,
  selectRecord,
} from "@/entities/history/model/history.slice";
import { addLog } from "@/entities/terminal/model/terminal.slice";
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
  const fontSize = useAppSelector((state) => state.settings.fontSize);
  const wordWrap = useAppSelector((state) => state.settings.wordWrap);
  const minimap = useAppSelector((state) => state.settings.minimap);
  const isDirty = useAppSelector((state) => state.editor.isDirty);
  const editorTheme =
    useAppSelector((state) => state.settings.editorTheme) || "vs-dark";
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

  const diffActive = useAppSelector((state) => state.history.diffActive);
  const selectedRecordId = useAppSelector(
    (state) => state.history.selectedRecordId,
  );
  const historyRecords =
    useAppSelector((state) => state.history.records[activeFile?.id || ""]) ||
    [];
  const selectedRecord = historyRecords.find((r) => r.id === selectedRecordId);

  // Local state for the text editor value to handle immediate text changes
  const [editorValue, setEditorValue] = useState("");

  // Sync editorValue whenever the active file changes
  useEffect(() => {
    if (activeFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditorValue(activeFile.content);
      dispatch(setLanguage(getEditorLanguage(activeFile.name)));
      dispatch(setDirty(false));
      // Seed initial history record if empty
      dispatch(
        addRecord({ fileId: activeFile.id, content: activeFile.content }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, activeFile?.id]);

  // Sync editorValue when content is restored/updated externally
  useEffect(() => {
    if (activeFile) {
      if (activeFile.content !== editorValue) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditorValue(activeFile.content);
        dispatch(setDirty(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile?.content]);

  const handleSave = () => {
    if (activeFile) {
      dispatch(updateContent({ id: activeFile.id, content: editorValue }));
      dispatch(setDirty(false));
      dispatch(addRecord({ fileId: activeFile.id, content: editorValue }));
      dispatch(addLog(`[info] File saved and compiled: ${activeFile.path}`));
    }
  };

  const handleRestoreRevision = (content: string) => {
    if (activeFile) {
      dispatch(updateContent({ id: activeFile.id, content }));
      dispatch(setDirty(false));
      dispatch(selectRecord(null));
      dispatch(
        addLog(
          `[info] Restored ${activeFile.name} to selected history version`,
        ),
      );
    }
  };

  const handleCloseActive = () => {
    if (activeTabId) {
      dispatch(closeTab(activeTabId));
    }
  };

  // Bind custom key Ctrl+S or Cmd+S for fake save indicator
  useKeyboardShortcut({ key: "s", ctrl: true }, () => handleSave());
  useKeyboardShortcut({ key: "s", meta: true }, () => handleSave());

  // Bind Ctrl+W or Alt+W to close active tab
  useKeyboardShortcut({ key: "w", ctrl: true }, () => handleCloseActive());
  useKeyboardShortcut({ key: "w", alt: true }, () => handleCloseActive());

  const handleEditorChange = (value: string | undefined) => {
    const newVal = value ?? "";
    setEditorValue(newVal);
    dispatch(setDirty(true));

    // Live update content immediately (no debounce needed since RTK is highly optimized client-side)
    if (activeFile) {
      dispatch(updateContent({ id: activeFile.id, content: newVal }));
    }
  };

  const handleEditorBeforeMount = (monaco: Monaco) => {
    monaco.editor.defineTheme("cyberpunk", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "75507B", fontStyle: "italic" },
        { token: "keyword", foreground: "FF0055", fontStyle: "bold" },
        { token: "string", foreground: "00FFCC" },
        { token: "number", foreground: "FFF600" },
        { token: "regexp", foreground: "FFF600" },
        { token: "type", foreground: "00FFCC", fontStyle: "italic" },
        { token: "delimiter", foreground: "FFFFFF" },
      ],
      colors: {
        "editor.background": "#0F021B",
        "editor.foreground": "#E0E0E0",
        "editorCursor.foreground": "#FF0055",
        "editor.lineHighlightBackground": "#2A0E47",
        "editorLineNumber.foreground": "#6D3A9C",
        "editorLineNumber.activeForeground": "#FF0055",
      },
    });

    monaco.editor.defineTheme("monokai", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "75715E", fontStyle: "italic" },
        { token: "keyword", foreground: "F92672", fontStyle: "bold" },
        { token: "string", foreground: "E6DB74" },
        { token: "number", foreground: "AE81FF" },
        { token: "regexp", foreground: "AE81FF" },
        { token: "type", foreground: "66D9EF", fontStyle: "italic" },
        { token: "class", foreground: "A6E22E" },
        { token: "function", foreground: "A6E22E" },
      ],
      colors: {
        "editor.background": "#272822",
        "editor.foreground": "#F8F8F2",
        "editorCursor.foreground": "#F8F8F0",
        "editor.lineHighlightBackground": "#3E3D32",
        "editorLineNumber.foreground": "#90908A",
        "editorLineNumber.activeForeground": "#F8F8F2",
      },
    });

    monaco.editor.defineTheme("github-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A737D", fontStyle: "italic" },
        { token: "keyword", foreground: "D73A49", fontStyle: "bold" },
        { token: "string", foreground: "032F62" },
        { token: "number", foreground: "005CC5" },
        { token: "regexp", foreground: "032F62" },
        { token: "type", foreground: "6F42C1" },
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#24292E",
        "editorCursor.foreground": "#044289",
        "editor.lineHighlightBackground": "#F1F8FF",
        "editorLineNumber.foreground": "#E1E4E8",
        "editorLineNumber.activeForeground": "#24292E",
      },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    // Track cursor movements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const handleTabDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
      // Make drag ghost slightly transparent
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = "0.5";
      }
    },
    [],
  );

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

  const handleTabDragEnter = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      dragCounterRef.current++;
      setDragOverIndex(index);
    },
    [],
  );

  const handleTabDragLeave = useCallback(() => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOverIndex(null);
    }
  }, []);

  const handleTabDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
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
    },
    [draggedIndex, dropSide, openedTabs.length, dispatch],
  );

  // --- Handlers for accepting file drops from the Explorer sidebar ---
  const isExplorerDrag = useCallback((e: React.DragEvent) => {
    return e.dataTransfer.types.includes("application/x-file-node-id");
  }, []);

  const handleExplorerDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isExplorerDrag(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setExplorerDragOver(true);
    },
    [isExplorerDrag],
  );

  const handleExplorerDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!isExplorerDrag(e)) return;
      setExplorerDragOver(false);
    },
    [isExplorerDrag],
  );

  const handleExplorerDrop = useCallback(
    (e: React.DragEvent) => {
      const fileId = e.dataTransfer.getData("application/x-file-node-id");
      if (!fileId) return;
      e.preventDefault();
      e.stopPropagation();
      setExplorerDragOver(false);
      dispatch(openTab(fileId));
    },
    [dispatch],
  );

  return (
    <div className="h-full w-full bg-bg-editor flex flex-col overflow-hidden">
      {/* File tab headers */}
      {openedTabs.length > 0 ? (
        <div
          className={cn(
            "flex h-9 w-full bg-bg-panel border-b border-border-primary overflow-x-auto select-none scrollbar-none shrink-0",
            explorerDragOver &&
              "ring-2 ring-inset ring-accent-primary/50 bg-accent-muted/10",
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
            const isDropTarget =
              dragOverIndex === index &&
              draggedIndex !== null &&
              draggedIndex !== index;

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

                <FileIcon name={file.name} className="h-3.5 w-3.5" />
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
            {diffActive && selectedRecord ? (
              <div className="flex-1 min-h-0 w-full flex flex-col relative">
                {/* Diff Viewer Banner */}
                <div className="h-8 w-full bg-accent-muted/15 border-b border-border-primary px-4 flex items-center justify-between text-xs text-text-primary shrink-0 select-none">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="h-2 w-2 rounded-full bg-accent-primary animate-pulse" />
                    <span>
                      Comparing current code with revision from{" "}
                      {new Date(selectedRecord.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleRestoreRevision(selectedRecord.content)
                      }
                      className="px-2 py-0.5 bg-accent-primary hover:bg-accent-hover text-white rounded font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Restore this version
                    </button>
                    <button
                      onClick={() => dispatch(selectRecord(null))}
                      className="px-2 py-0.5 bg-hover-bg hover:bg-border-primary text-text-primary border border-border-primary rounded font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Close Diff
                    </button>
                  </div>
                </div>

                {/* Monaco DiffEditor */}
                <div className="flex-1 min-h-0 w-full relative">
                  <DiffEditor
                    height="100%"
                    theme={editorTheme}
                    language={getEditorLanguage(activeFile.name)}
                    original={selectedRecord.content}
                    modified={editorValue}
                    options={{
                      readOnly: true,
                      fontSize,
                      minimap: { enabled: minimap },
                      automaticLayout: true,
                      fontFamily:
                        "var(--font-mono), Menlo, Monaco, Courier New, monospace",
                      renderSideBySide: true,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 w-full flex flex-col relative">
                <div className="flex-1 min-h-0 w-full relative">
                  <Editor
                    height="100%"
                    theme={editorTheme}
                    language={getEditorLanguage(activeFile.name)}
                    value={editorValue}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    beforeMount={handleEditorBeforeMount}
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
                      Language:{" "}
                      {getEditorLanguage(activeFile.name).toUpperCase()}
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
            )}
          </div>
        ) : (
          /* Blank screen showing keyboard shortcut lists when no tabs are open */
          <div
            className={cn(
              "h-full w-full flex flex-col items-center justify-center bg-bg-editor p-8 text-center select-none animate-in fade-in duration-300",
              explorerDragOver &&
                "ring-2 ring-inset ring-accent-primary/40 bg-accent-muted/5",
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
