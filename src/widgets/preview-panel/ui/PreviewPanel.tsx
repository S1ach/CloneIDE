"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { setPreviewOpen, setPreviewActiveTabId } from "@/entities/settings/model/settings.slice";
import { FileNode } from "@/entities/file/types";
import { cn } from "@/shared/lib/cn";

type PreviewTab =
  | { id: string; type: "preview"; title: string }
  | { id: string; type: "url"; title: string; url: string };

export function PreviewPanel() {
  const fileTree = useAppSelector((state) => state.files.tree);
  const dispatch = useAppDispatch();

  // --- Tab management ---
  const [tabs, setTabs] = useState<PreviewTab[]>([
    { id: "preview", type: "preview", title: "Preview" },
  ]);
  const activeTabId = useAppSelector((state) => state.settings.previewActiveTabId) || "preview";
  const setActiveTabId = (id: string) => dispatch(setPreviewActiveTabId(id));
  const [urlInputVisible, setUrlInputVisible] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);

  // --- Preview (srcDoc) state ---
  const [iframeKey, setIframeKey] = useState(0);
  const [srcDoc, setSrcDoc] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // --- URL tab reload keys ---
  const [urlKeys, setUrlKeys] = useState<Record<string, number>>({});

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (activeTab.type === "preview") {
      setAddressInput("http://localhost:3000/");
    } else {
      setAddressInput(activeTab.url);
    }
  }, [activeTabId, activeTab.type, activeTab.type === "url" ? activeTab.url : ""]);

  // Focus URL input when shown
  useEffect(() => {
    if (urlInputVisible && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [urlInputVisible]);

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
        })();
      </script>
    `;

    // Inject styles and scripts
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

    setSrcDoc(rawHtml);
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
    if (activeTab.type === "preview") {
      setIframeKey((prev) => prev + 1);
      dispatch(addLog("[info] Reloading live preview sandbox..."));
    } else {
      setUrlKeys((prev) => ({
        ...prev,
        [activeTab.id]: (prev[activeTab.id] || 0) + 1,
      }));
    }
  };

  const handleOpenExternal = () => {
    if (activeTab.type === "preview") {
      const win = window.open();
      if (win) {
        win.document.write(srcDoc);
        win.document.close();
      }
    } else if (activeTab.type === "url") {
      window.open(activeTab.url, "_blank");
    }
  };

  const handleCloseTab = (tabId: string) => {
    // Don't close the last tab — close the whole panel instead
    if (tabs.length === 1) {
      dispatch(setPreviewOpen(false));
      return;
    }
    const index = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      const nextIndex = Math.min(index, newTabs.length - 1);
      setActiveTabId(newTabs[nextIndex].id);
    }
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
    const newTab: PreviewTab = {
      id: `url-${Date.now()}`,
      type: "url",
      title,
      url,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setUrlInputVisible(false);
    setUrlInputValue("");
  };

  const handleAddressSubmit = () => {
    let inputUrl = addressInput.trim();
    if (!inputUrl) {
      if (activeTab.type === "preview") {
        setAddressInput("http://localhost:3000/");
      } else {
        setAddressInput(activeTab.url);
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
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { id: t.id, type: "preview", title: "Preview" }
            : t
        )
      );
      return;
    }

    if (!inputUrl.startsWith("http")) {
      inputUrl = "https://" + inputUrl;
    }

    let hostname: string;
    try {
      hostname = new URL(inputUrl).hostname;
    } catch {
      hostname = inputUrl;
    }

    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? ({ ...t, type: "url", title: hostname, url: inputUrl } as PreviewTab)
          : t
      )
    );

    if (activeTab.type === "url") {
      setUrlKeys((prev) => ({
        ...prev,
        [activeTabId]: (prev[activeTabId] || 0) + 1,
      }));
    }
  };

  return (
    <div className="h-full w-full bg-bg-panel border-l border-border-primary flex flex-col overflow-hidden">
      {/* Tab header bar */}
      <div className="h-9 w-full bg-bg-panel border-b border-border-primary flex items-center select-none shrink-0 overflow-x-auto scrollbar-none">
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
              ) : (
                <Globe className="h-3 w-3 text-sky-400 shrink-0" />
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

        {/* URL input inline */}
        {urlInputVisible && (
          <div className="flex items-center h-full px-2 shrink-0" style={{ gap: 4 }}>
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

        {/* Add tab button */}
        <button
          onClick={handleAddUrlTab}
          className="flex items-center justify-center h-full px-2.5 text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors shrink-0"
          title="Open URL tab"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

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
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Address bar display */}
        <div className="flex-1 max-w-md mx-4 h-6 rounded-md border border-border-primary bg-bg-primary px-3 flex items-center gap-1.5 text-xs text-text-secondary focus-within:border-accent-primary focus-within:text-text-primary transition-colors">
          <Globe className="h-3.5 w-3.5 text-text-secondary shrink-0" />
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddressSubmit();
                e.currentTarget.blur();
              }
              if (e.key === "Escape") {
                if (activeTab.type === "preview") {
                  setAddressInput("http://localhost:3000/");
                } else {
                  setAddressInput(activeTab.url);
                }
                e.currentTarget.blur();
              }
            }}
            onBlur={() => {
              handleAddressSubmit();
            }}
            onFocus={(e) => e.target.select()}
            className="w-full bg-transparent text-text-primary outline-none border-none placeholder-text-secondary text-xs h-full"
            placeholder="Search or enter web address"
          />
        </div>

        {/* Action icons */}
        <div className="shrink-0 flex items-center">
          <button
            onClick={handleOpenExternal}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
            title="Open in new window"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Iframe content — render active tab */}
      <div className="flex-1 w-full bg-white relative">
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
        ) : null}
      </div>
    </div>
  );
}
