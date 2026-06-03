"use client";

import React, { useState, useEffect } from "react";
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
import { closeTab, setActiveTab } from "@/entities/tab/model/tabs.slice";
import {
  updateCursor,
  setLanguage,
  setDirty,
} from "@/entities/editor/model/editor.slice";
import { FileIcon } from "@/widgets/sidebar/ui/FileExplorer";
import { useKeyboardShortcut } from "@/shared/hooks/useKeyboardShortcut";
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

  // Editor Settings
  const theme = useAppSelector((state) => state.settings.theme);
  const fontSize = useAppSelector((state) => state.settings.fontSize);
  const wordWrap = useAppSelector((state) => state.settings.wordWrap);
  const minimap = useAppSelector((state) => state.settings.minimap);
  const isDirty = useAppSelector((state) => state.editor.isDirty);
  const cursorLine = useAppSelector((state) => state.editor.cursorLine);
  const cursorColumn = useAppSelector((state) => state.editor.cursorColumn);

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

  return (
    <div className="h-full w-full bg-bg-editor flex flex-col overflow-hidden">
      {/* File tab headers */}
      {openedTabs.length > 0 ? (
        <div className="flex h-9 w-full bg-bg-panel border-b border-border-primary overflow-x-auto select-none scrollbar-none shrink-0">
          {openedTabs.map((tabId) => {
            const file = findNodeById(fileTree, tabId);
            if (!file) return null;
            const isActive = tabId === activeTabId;

            return (
              <div
                key={tabId}
                onClick={() => dispatch(setActiveTab(tabId))}
                className={cn(
                  "flex items-center px-5 h-full border-r border-border-primary cursor-pointer text-xs font-medium transition-all relative shrink-0",
                  isActive
                    ? "bg-bg-editor text-text-primary border-t-2 border-t-accent-primary"
                    : "bg-tab-inactive text-text-secondary hover:text-text-primary hover:bg-hover-bg",
                )}
                style={{ gap: 10 }}
              >
                <FileIcon
                  name={file.name}
                  className="h-3.5 w-3.5"
                />
                <span>{file.name}</span>
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
          <div className="h-full w-full flex flex-col items-center justify-center bg-bg-editor p-8 text-center select-none animate-in fade-in duration-300">
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
                    <Command className="h-3.5 w-3.5" /> Toggle Command Palette
                  </span>
                  <div className="flex gap-1">
                    <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                      ⌘ K
                    </kbd>
                    <span className="text-text-secondary">or</span>
                    <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                      Ctrl P
                    </kbd>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-text-primary">
                  <span className="text-text-secondary flex items-center gap-2">
                    <Files className="h-3.5 w-3.5" /> Open File Explorer
                  </span>
                  <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                    Ctrl Shift E
                  </kbd>
                </div>

                <div className="flex justify-between items-center text-xs text-text-primary">
                  <span className="text-text-secondary flex items-center gap-2">
                    <Search className="h-3.5 w-3.5" /> Search Files
                  </span>
                  <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                    Ctrl Shift F
                  </kbd>
                </div>

                <div className="flex justify-between items-center text-xs text-text-primary">
                  <span className="text-text-secondary flex items-center gap-2">
                    <Save className="h-3.5 w-3.5" /> Save & Compile
                  </span>
                  <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                    Ctrl S
                  </kbd>
                </div>

                <div className="flex justify-between items-center text-xs text-text-primary">
                  <span className="text-text-secondary flex items-center gap-2">
                    <X className="h-3.5 w-3.5" /> Close Active Tab
                  </span>
                  <kbd className="bg-hover-bg px-2 py-0.5 rounded border border-border-primary font-mono text-[10px] uppercase">
                    Alt W
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
