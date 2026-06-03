"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  Globe,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import { findNodeById } from "@/entities/file/model/files.slice";
import { addLog } from "@/entities/terminal/model/terminal.slice";
import { FileNode } from "@/entities/file/types";

export function PreviewPanel() {
  const fileTree = useAppSelector((state) => state.files.tree);
  const dispatch = useAppDispatch();
  const [iframeKey, setIframeKey] = useState(0);
  const [srcDoc, setSrcDoc] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    // 1. Interceptor script goes at the very top of <head>
    if (rawHtml.includes("<head>")) {
      rawHtml = rawHtml.replace("<head>", `<head>${consoleInterceptorScript}`);
    } else {
      rawHtml = consoleInterceptorScript + rawHtml;
    }

    // 2. Inject CSS
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

    // 3. Inject JS
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

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
    dispatch(addLog("[info] Reloading live preview sandbox..."));
  };

  const handleOpenExternal = () => {
    const win = window.open();
    if (win) {
      win.document.write(srcDoc);
      win.document.close();
    }
  };

  return (
    <div className="h-full w-full bg-bg-panel border-l border-border-primary flex flex-col overflow-hidden">
      {/* Mock Browser Title and Address Bar */}
      <div className="h-9 w-full bg-bg-panel-header border-b border-border-primary flex items-center justify-between px-3 select-none">
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
            title="Reload Preview"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Address bar input */}
        <div className="flex-1 max-w-md mx-4 h-6 rounded-md border border-border-primary bg-bg-primary px-3 flex items-center gap-1.5 text-xs text-text-secondary overflow-hidden">
          <Globe className="h-3.5 w-3.5 text-text-secondary shrink-0" />
          <span className="truncate select-text">http://localhost:3000/</span>
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

      {/* Main iframe view */}
      <div className="flex-1 w-full bg-white relative">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-modals"
          className="h-full w-full border-none bg-white"
          title="Sandbox Live Preview"
        />
      </div>
    </div>
  );
}
