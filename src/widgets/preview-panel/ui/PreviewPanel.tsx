"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  Globe,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  X,
  Plus,
  Play,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import { addLog } from "@/entities/terminal/model/terminal.slice";
import {
  setPreviewOpen,
  setPreviewActiveTabId,
  addPreviewTab,
  closePreviewTab,
  setPreviewTabs,
  PreviewTab,
} from "@/entities/settings/model/settings.slice";
import { FileNode } from "@/entities/file/types";
import { findNodeById } from "@/entities/file/model/files.slice";
import { FileIcon } from "@/widgets/sidebar/ui/FileExplorer";
import { cn } from "@/shared/lib/cn";

// Inline Markdown parsing & rendering
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let keyIdx = 0;

  while (currentText.length > 0) {
    const boldIndex = currentText.indexOf("**");
    const italicIndex = currentText.indexOf("*");
    const codeIndex = currentText.indexOf("`");

    const indices = [
      { type: "bold", index: boldIndex },
      { type: "italic", index: italicIndex },
      { type: "code", index: codeIndex },
    ].filter((item) => item.index !== -1);

    if (indices.length === 0) {
      parts.push(<span key={keyIdx++}>{currentText}</span>);
      break;
    }

    indices.sort((a, b) => a.index - b.index);
    const earliest = indices[0];

    if (earliest.index > 0) {
      parts.push(
        <span key={keyIdx++}>{currentText.slice(0, earliest.index)}</span>,
      );
    }

    const remaining = currentText.slice(earliest.index);

    if (earliest.type === "bold" && remaining.length > 2) {
      const closingIndex = remaining.indexOf("**", 2);
      if (closingIndex !== -1) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-accent-primary">
            {remaining.slice(2, closingIndex)}
          </strong>,
        );
        currentText = remaining.slice(closingIndex + 2);
        continue;
      }
    }

    if (earliest.type === "italic" && remaining.length > 1) {
      const closingIndex = remaining.indexOf("*", 1);
      if (closingIndex !== -1) {
        parts.push(
          <em key={keyIdx++} className="italic text-text-secondary">
            {remaining.slice(1, closingIndex)}
          </em>,
        );
        currentText = remaining.slice(closingIndex + 1);
        continue;
      }
    }

    if (earliest.type === "code" && remaining.length > 1) {
      const closingIndex = remaining.indexOf("`", 1);
      if (closingIndex !== -1) {
        parts.push(
          <code
            key={keyIdx++}
            className="bg-hover-bg px-1.5 py-0.5 rounded font-mono text-xs border border-border-primary text-text-primary"
          >
            {remaining.slice(1, closingIndex)}
          </code>,
        );
        currentText = remaining.slice(closingIndex + 1);
        continue;
      }
    }

    parts.push(<span key={keyIdx++}>{remaining.slice(0, 1)}</span>);
    currentText = remaining.slice(1);
  }

  return parts;
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = "";

  const renderedElements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        const codeText = codeBlockLines.join("\n");
        renderedElements.push(
          <pre
            key={`code-${i}`}
            className="bg-input-bg border border-border-primary rounded-lg p-4 font-mono text-xs text-text-primary overflow-x-auto my-3 select-text"
          >
            <code className={codeBlockLang}>{codeText}</code>
          </pre>,
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = line.replace("```", "").trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      renderedElements.push(
        <h1
          key={i}
          className="text-2xl font-bold text-text-primary mt-6 mb-3 pb-1.5 border-b border-border-primary"
        >
          {parseInlineMarkdown(line.slice(2))}
        </h1>,
      );
    } else if (line.startsWith("## ")) {
      renderedElements.push(
        <h2
          key={i}
          className="text-xl font-bold text-text-primary mt-5 mb-2.5 pb-1 border-b border-border-primary/50"
        >
          {parseInlineMarkdown(line.slice(3))}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      renderedElements.push(
        <h3 key={i} className="text-lg font-bold text-text-primary mt-4 mb-2">
          {parseInlineMarkdown(line.slice(4))}
        </h3>,
      );
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const cleanLine = line.trim().slice(2);
      renderedElements.push(
        <ul key={i} className="list-disc pl-6 text-sm text-text-primary my-1">
          <li>{parseInlineMarkdown(cleanLine)}</li>
        </ul>,
      );
    } else if (line.trim() === "") {
      renderedElements.push(<div key={i} className="h-2" />);
    } else {
      renderedElements.push(
        <p key={i} className="text-sm text-text-primary leading-relaxed my-2">
          {parseInlineMarkdown(line)}
        </p>,
      );
    }
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-bg-editor select-text">
      {renderedElements}
    </div>
  );
}

function CodePreview({ name, content }: { name: string; content: string }) {
  const lines = content.split("\n");
  return (
    <div className="h-full w-full bg-bg-editor flex flex-col overflow-hidden select-text">
      <div className="h-6 px-4 bg-bg-panel border-b border-border-primary flex items-center text-[10px] text-text-secondary select-none shrink-0 font-medium">
        File Source: {name}
      </div>
      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-text-primary bg-bg-editor">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-hover-bg/30">
                <td className="w-8 text-right pr-4 text-text-secondary select-none opacity-40 font-mono text-[10px]">
                  {idx + 1}
                </td>
                <td className="whitespace-pre font-mono">{line || " "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PreviewPanel() {
  const fileTree = useAppSelector((state) => state.files.tree);
  const dispatch = useAppDispatch();

  // --- Tab management via Redux ---
  const tabs = useAppSelector((state) => state.settings.previewTabs) || [];
  const activeTabId =
    useAppSelector((state) => state.settings.previewActiveTabId) || "";
  const openedTabs = useAppSelector((state) => state.tabs.opened) || [];

  const setActiveTabId = (id: string) => dispatch(setPreviewActiveTabId(id));

  const [urlInputVisible, setUrlInputVisible] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);

  // --- Dropdown Management ---
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Preview (srcDoc) state ---
  const [iframeKey, setIframeKey] = useState(0);
  const [srcDoc, setSrcDoc] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // --- URL tab reload keys ---
  const [urlKeys, setUrlKeys] = useState<Record<string, number>>({});

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (!activeTab) return;
    if (activeTab.type === "preview") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddressInput("http://localhost:3000/");
    } else if (activeTab.type === "url") {
      setAddressInput(activeTab.url);
    } else if (activeTab.type === "file") {
      setAddressInput(`file://${activeTab.fileId}`);
    }
  }, [activeTabId, activeTab]);

  // Focus URL input when shown
  useEffect(() => {
    if (urlInputVisible && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [urlInputVisible]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [dropdownOpen]);

  // Helper to find files by path
  const findFileByPath = (nodes: FileNode[], path: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === path && node.type === "file") return node;
      if (node.children) {
        const found = findFileByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  // Compile the files to create the srcDoc html
  useEffect(() => {
    const htmlFile = findFileByPath(fileTree, "/index.html");
    const cssFile = findFileByPath(fileTree, "/styles.css");
    const jsFile = findFileByPath(fileTree, "/index.js");

    let rawHtml =
      htmlFile?.content ||
      `
      <!DOCTYPE html>
      <html>
        <head><title>Preview</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #1e1e1e; color: #fff;">
          <h1>No index.html found</h1>
          <p>Create an <strong>index.html</strong> file in the root directory to preview.</p>
        </body>
      </html>
    `;

    const stylesContent = cssFile?.content || "";
    const jsContent = jsFile?.content || "";

    // Inject console logging proxy into the preview iframe
    const consoleInterceptorScript = `
      <script>
        (function() {
          const proxyLog = (type, args) => {
            const content = args.map(arg => {
              if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch (e) { return String(arg); }
              }
              return String(arg);
            }).join(' ');
            window.parent.postMessage({ type: 'IFRAME_CONSOLE', level: type, content }, '*');
          };
          
          const oldLog = console.log;
          console.log = function(...args) {
            oldLog.apply(console, args);
            proxyLog('log', args);
          };
          
          const oldError = console.error;
          console.error = function(...args) {
            oldError.apply(console, args);
            proxyLog('error', args);
          };
          
          const oldWarn = console.warn;
          console.warn = function(...args) {
            oldWarn.apply(console, args);
            proxyLog('warn', args);
          };
          
          window.onerror = function(message, source, lineno, colno, error) {
            proxyLog('error', [message + ' (line ' + lineno + ')']);
            return false;
          };

          window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'EVAL_JS') {
              try {
                const result = window.eval(event.data.code);
                proxyLog('log', [result !== undefined ? String(result) : 'undefined']);
              } catch (e) {
                proxyLog('error', [e.message]);
              }
            }
          });
        })();
      </script>
    `;

    if (rawHtml.includes("<head>")) {
      rawHtml = rawHtml.replace("<head>", `<head>${consoleInterceptorScript}`);
    } else {
      rawHtml = consoleInterceptorScript + rawHtml;
    }

    if (stylesContent) {
      if (rawHtml.includes("</head>")) {
        rawHtml = rawHtml.replace(
          "</head>",
          `<style>${stylesContent}</style></head>`,
        );
      } else {
        rawHtml += `<style>${stylesContent}</style>`;
      }
    }

    if (jsContent) {
      if (rawHtml.includes("</body>")) {
        rawHtml = rawHtml.replace(
          "</body>",
          `<script>${jsContent}</script></body>`,
        );
      } else {
        rawHtml += `<script>${jsContent}</script>`;
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrcDoc(rawHtml);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileTree]);

  // Listen to message events from iframe consoles
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "IFRAME_CONSOLE") {
        const { level, content } = event.data;
        const prefix =
          level === "error"
            ? "🔴 [error]"
            : level === "warn"
              ? "🟡 [warning]"
              : "🟢 [console]";
        dispatch(addLog(`${prefix} ${content}`));
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => {
      window.removeEventListener("message", handleIframeMessage);
    };
  }, [dispatch]);

  // --- Handlers ---
  const handleRefresh = () => {
    if (!activeTab) return;
    if (activeTab.type === "preview") {
      setIframeKey((prev) => prev + 1);
      dispatch(addLog("[info] Reloading live preview sandbox..."));
    } else if (activeTab.type === "url") {
      setUrlKeys((prev) => ({
        ...prev,
        [activeTab.id]: (prev[activeTab.id] || 0) + 1,
      }));
    }
  };

  const handleOpenExternal = () => {
    if (!activeTab) return;
    if (activeTab.type === "preview") {
      const win = window.open();
      if (win) {
        win.document.write(srcDoc);
        win.document.close();
      }
    } else if (activeTab.type === "url") {
      window.open(activeTab.url, "_blank");
    } else if (activeTab.type === "file") {
      const file = findNodeById(fileTree, activeTab.fileId);
      if (file) {
        const win = window.open();
        if (win) {
          win.document.write(`<pre>${file.content}</pre>`);
          win.document.close();
        }
      }
    }
  };

  const handleCloseTab = (tabId: string) => {
    dispatch(closePreviewTab(tabId));
  };

  const handleAddUrlTab = () => {
    setUrlInputVisible(true);
    setUrlInputValue("");
  };

  const handleUrlSubmit = () => {
    let url = urlInputValue.trim();
    if (!url) {
      setUrlInputVisible(false);
      return;
    }
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }
    let title: string;
    try {
      title = new URL(url).hostname;
    } catch {
      title = url;
    }
    dispatch(
      addPreviewTab({
        id: `url-${Date.now()}`,
        type: "url",
        title,
        url,
      }),
    );
    setUrlInputVisible(false);
    setUrlInputValue("");
  };

  const handleAddressSubmit = () => {
    if (!activeTab) return;
    let inputUrl = addressInput.trim();
    if (!inputUrl) {
      if (activeTab.type === "preview") {
        setAddressInput("http://localhost:3000/");
      } else if (activeTab.type === "url") {
        setAddressInput(activeTab.url);
      } else if (activeTab.type === "file") {
        setAddressInput(`file://${activeTab.fileId}`);
      }
      return;
    }

    const isLocalhost =
      inputUrl === "localhost:3000" ||
      inputUrl === "http://localhost:3000" ||
      inputUrl === "http://localhost:3000/" ||
      inputUrl === "https://localhost:3000" ||
      inputUrl === "https://localhost:3000/";

    if (isLocalhost) {
      dispatch(
        setPreviewTabs(
          tabs.map((t) =>
            t.id === activeTabId
              ? { id: t.id, type: "preview", title: "Preview" }
              : t,
          ),
        ),
      );
      return;
    }

    if (!inputUrl.startsWith("http") && !inputUrl.startsWith("file://")) {
      inputUrl = "https://" + inputUrl;
    }

    let hostname: string;
    try {
      hostname = new URL(inputUrl).hostname;
    } catch {
      hostname = inputUrl;
    }

    dispatch(
      setPreviewTabs(
        tabs.map((t) =>
          t.id === activeTabId
            ? ({
                ...t,
                type: "url",
                title: hostname,
                url: inputUrl,
              } as PreviewTab)
            : t,
        ),
      ),
    );

    if (activeTab.type === "url") {
      setUrlKeys((prev) => ({
        ...prev,
        [activeTabId]: (prev[activeTabId] || 0) + 1,
      }));
    }
  };

  const renderDropdownMenu = () => {
    return (
      <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-border-primary bg-bg-panel/95 backdrop-blur-md shadow-lg py-1.5 z-50 animate-in fade-in duration-100">
        <button
          onClick={() => {
            dispatch(
              addPreviewTab({
                id: `preview-${Date.now()}`,
                type: "preview",
                title: "Preview",
              }),
            );
            setDropdownOpen(false);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-primary hover:bg-hover-bg transition-colors text-left font-medium"
        >
          <Play className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          Local Live Preview
        </button>
        <button
          onClick={() => {
            handleAddUrlTab();
            setDropdownOpen(false);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-primary hover:bg-hover-bg transition-colors text-left font-medium"
        >
          <Globe className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          External URL...
        </button>

        <div className="border-t border-border-primary/50 my-1" />

        <div className="px-3 py-1 text-[9px] font-bold text-text-secondary uppercase tracking-wider select-none">
          Open Editor Tabs
        </div>

        {openedTabs.length === 0 ? (
          <div className="px-3 py-2 text-[11px] text-text-secondary italic select-none">
            No files open in editor
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            {openedTabs.map((tabId) => {
              const file = findNodeById(fileTree, tabId);
              if (!file) return null;
              return (
                <button
                  key={tabId}
                  onClick={() => {
                    dispatch(
                      addPreviewTab({
                        id: `file-${file.id}`,
                        type: "file",
                        title: file.name,
                        fileId: file.id,
                      }),
                    );
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-primary hover:bg-hover-bg transition-colors text-left font-medium"
                >
                  <FileIcon name={file.name} className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="flex-1 w-full bg-bg-editor flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto">
        <div className="max-w-md space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-center">
            <div className="rounded-full bg-accent-muted p-4 text-accent-primary">
              <Globe className="h-10 w-10 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">
              No Preview Tabs Active
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto">
              Open a compiled live preview sandbox, browse an external website,
              or select a file from your active editor tabs below.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              onClick={() =>
                dispatch(
                  addPreviewTab({
                    id: `preview-${Date.now()}`,
                    type: "preview",
                    title: "Preview",
                  }),
                )
              }
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-accent-primary hover:bg-accent-hover rounded-md shadow-sm transition-all cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 shrink-0" />
              Open Live Preview
            </button>
            <button
              onClick={handleAddUrlTab}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-text-primary bg-hover-bg hover:bg-border-primary rounded-md border border-border-primary transition-all cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 shrink-0" />
              Open URL...
            </button>
          </div>

          {openedTabs.length > 0 && (
            <div className="border-t border-border-primary/50 pt-5 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-2">
                Available Editor Tabs
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {openedTabs.map((tabId) => {
                  const file = findNodeById(fileTree, tabId);
                  if (!file) return null;
                  return (
                    <button
                      key={tabId}
                      onClick={() =>
                        dispatch(
                          addPreviewTab({
                            id: `file-${file.id}`,
                            type: "file",
                            title: file.name,
                            fileId: file.id,
                          }),
                        )
                      }
                      className="flex items-center gap-2 p-2 rounded-lg border border-border-primary bg-bg-panel hover:bg-hover-bg transition-colors text-xs font-medium text-text-primary text-left cursor-pointer"
                    >
                      <FileIcon name={file.name} className="h-4 w-4 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const activeFileNode =
    activeTab && activeTab.type === "file"
      ? findNodeById(fileTree, activeTab.fileId)
      : null;

  return (
    <div className="h-full w-full bg-bg-panel border-l border-border-primary flex flex-col overflow-hidden relative">
      {/* Tab header bar */}
      <div className="h-9 w-full bg-bg-panel border-b border-border-primary flex items-center justify-between select-none shrink-0 px-2 overflow-visible">
        <div className="flex items-center h-full overflow-x-auto scrollbar-none gap-0.5">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "flex items-center px-3 h-full border-r border-border-primary cursor-pointer text-xs font-medium transition-all relative shrink-0",
                  isActive
                    ? "bg-bg-editor text-text-primary border-t-2 border-t-accent-primary"
                    : "bg-tab-inactive text-text-secondary hover:text-text-primary hover:bg-hover-bg",
                )}
                style={{ gap: 6 }}
              >
                {tab.type === "preview" ? (
                  <Play className="h-3 w-3 text-emerald-400 shrink-0" />
                ) : tab.type === "url" ? (
                  <Globe className="h-3 w-3 text-sky-400 shrink-0" />
                ) : (
                  <FileIcon name={tab.title} className="h-3 w-3 shrink-0" />
                )}
                <span className="max-w-[100px] truncate">{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                  className="p-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {/* URL input inline inline to tab header if active/shown */}
          {urlInputVisible && (
            <div
              className="flex items-center h-full px-2 shrink-0"
              style={{ gap: 4 }}
            >
              <Globe className="h-3 w-3 text-sky-400 shrink-0" />
              <input
                ref={urlInputRef}
                type="text"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUrlSubmit();
                  if (e.key === "Escape") setUrlInputVisible(false);
                }}
                onBlur={() => {
                  if (!urlInputValue.trim()) setUrlInputVisible(false);
                }}
                className="w-36 h-5 bg-input-bg text-text-primary text-xs border border-accent-primary px-2 rounded outline-none"
                placeholder="Enter URL..."
              />
            </div>
          )}
        </div>

        {/* Add tab button with dropdown */}
        <div
          className="relative shrink-0 flex items-center h-full"
          ref={dropdownRef}
        >
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-center h-7 w-7 rounded-md text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-all"
            title="Open a preview or URL tab"
          >
            <Plus className="h-4 w-4" />
          </button>
          {dropdownOpen && renderDropdownMenu()}
        </div>
      </div>

      {tabs.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Browser Address Bar */}
          <div className="h-9 w-full bg-bg-panel-header border-b border-border-primary flex items-center justify-between px-3 select-none shrink-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg disabled:opacity-30"
                disabled
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button
                className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg disabled:opacity-30"
                disabled
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
                title="Reload"
                disabled={activeTab.type === "file"}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Address bar display */}
            <div className="flex-1 max-w-md mx-4 h-6 rounded-md border border-border-primary bg-bg-primary px-3 flex items-center gap-1.5 text-xs text-text-secondary focus-within:border-accent-primary focus-within:text-text-primary transition-colors">
              {activeTab.type === "preview" ? (
                <Play className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              ) : activeTab.type === "url" ? (
                <Globe className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              ) : (
                <FileIcon
                  name={activeTab.title}
                  className="h-3.5 w-3.5 shrink-0"
                />
              )}
              <input
                type="text"
                value={addressInput}
                disabled={activeTab.type === "file"}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddressSubmit();
                    e.currentTarget.blur();
                  }
                  if (e.key === "Escape") {
                    if (activeTab.type === "preview") {
                      setAddressInput("http://localhost:3000/");
                    } else if (activeTab.type === "url") {
                      setAddressInput(activeTab.url);
                    }
                    e.currentTarget.blur();
                  }
                }}
                onBlur={() => {
                  handleAddressSubmit();
                }}
                onFocus={(e) => e.target.select()}
                className="w-full bg-transparent text-text-primary outline-none border-none placeholder-text-secondary text-xs h-full disabled:opacity-80"
                placeholder={
                  activeTab.type === "file" ? "" : "Search or enter web address"
                }
              />
            </div>

            {/* Action icons */}
            <div className="shrink-0 flex items-center gap-1">
              <button
                onClick={handleOpenExternal}
                className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
                title="Open in new window"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => dispatch(setPreviewOpen(false))}
                className="p-1 rounded text-text-secondary hover:text-red-500 hover:bg-hover-bg transition-colors"
                title="Close panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Render Active Tab Content */}
          <div className="flex-1 w-full bg-bg-editor relative">
            {activeTab.type === "preview" ? (
              <iframe
                key={iframeKey}
                ref={iframeRef}
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-modals"
                className="h-full w-full border-none bg-white"
                title="Sandbox Live Preview"
              />
            ) : activeTab.type === "url" ? (
              <iframe
                key={urlKeys[activeTab.id] || 0}
                src={activeTab.url}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className="h-full w-full border-none bg-white"
                title={activeTab.title}
              />
            ) : activeTab.type === "file" ? (
              activeFileNode ? (
                activeFileNode.name.endsWith(".md") ? (
                  <MarkdownPreview content={activeFileNode.content} />
                ) : activeFileNode.name.endsWith(".html") ? (
                  <iframe
                    srcDoc={activeFileNode.content}
                    sandbox="allow-scripts allow-modals"
                    className="h-full w-full border-none bg-white"
                    title={activeFileNode.name}
                  />
                ) : (
                  <CodePreview
                    name={activeFileNode.name}
                    content={activeFileNode.content}
                  />
                )
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center select-none bg-bg-editor text-text-secondary text-xs">
                  File not found, or it was deleted in workspace.
                </div>
              )
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
