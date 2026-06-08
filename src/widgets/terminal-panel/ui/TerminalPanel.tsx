"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import { addLog, clearLogs } from "@/entities/terminal/model/terminal.slice";
import {
  setTheme,
  setPreviewOpen,
  setPreviewActiveTabId,
} from "@/entities/settings/model/settings.slice";
import { FileNode } from "@/entities/file/types";
import { ScrollArea } from "@/shared/ui/ScrollArea";
import { createNode, deleteNode } from "@/entities/file/model/files.slice";

// Path resolution helpers
const resolvePath = (
  nodes: FileNode[],
  path: string,
): { parentId: string | null; name: string } | null => {
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  const parts = cleanPath.split("/").filter(Boolean);

  if (parts.length === 0) return null;
  if (parts.length === 1) {
    return { parentId: null, name: parts[0] };
  }

  let currentNodes = nodes;
  let currentParentId: string | null = null;

  for (let i = 0; i < parts.length - 1; i++) {
    const segment = parts[i];
    const foundNode = currentNodes.find(
      (n) => n.name === segment && n.type === "folder",
    );
    if (!foundNode) {
      return null;
    }
    currentParentId = foundNode.id;
    currentNodes = foundNode.children || [];
  }

  return {
    parentId: currentParentId,
    name: parts[parts.length - 1],
  };
};

const findNodeByPath = (nodes: FileNode[], path: string): FileNode | null => {
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  for (const node of nodes) {
    if (node.path === cleanPath) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

export function TerminalPanel() {
  const [inputVal, setInputVal] = useState("");
  const dispatch = useAppDispatch();
  const logs = useAppSelector((state) => state.terminal.logs);
  const fileTree = useAppSelector((state) => state.files.tree);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new logs are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Helper to format flat files listing for 'ls'
  const getFlatFileListing = (nodes: FileNode[], indent = ""): string[] => {
    const list: string[] = [];
    for (const node of nodes) {
      if (node.type === "file") {
        list.push(`${indent}📄 ${node.name}`);
      } else {
        list.push(`${indent}📁 ${node.name}/`);
        if (node.children) {
          list.push(...getFlatFileListing(node.children, `${indent}  `));
        }
      }
    }
    return list;
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Log the typed command
    dispatch(addLog(`$ ${cmd}`));
    setInputVal("");

    const parts = cmd.split(" ");
    const primaryCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (primaryCmd) {
      case "help":
        dispatch(addLog("Available commands:"));
        dispatch(addLog("  help                Display list of commands"));
        dispatch(addLog("  clear               Clear terminal logs"));
        dispatch(
          addLog("  ls                  List all files in workspace tree"),
        );
        dispatch(addLog("  touch <filename>    Create a new empty file"));
        dispatch(addLog("  mkdir <dirname>     Create a new folder"));
        dispatch(addLog("  rm <path>           Delete a file or folder"));
        dispatch(addLog("  cat <filename>      Print file content"));
        dispatch(addLog("  theme <light|dark>  Toggle color theme"));
        dispatch(
          addLog("  npm run dev         Start Next.js mockup dev server"),
        );
        dispatch(
          addLog(
            "  js <expr>           Evaluate JavaScript code inside active Preview Sandbox",
          ),
        );
        break;

      case "clear":
        dispatch(clearLogs());
        break;

      case "ls":
        const fileList = getFlatFileListing(fileTree);
        if (fileList.length === 0) {
          dispatch(addLog("Workspace is empty."));
        } else {
          fileList.forEach((line) => dispatch(addLog(line)));
        }
        break;

      case "touch": {
        const path = args[0];
        if (!path) {
          dispatch(addLog("touch: missing file operand"));
          break;
        }
        const resolved = resolvePath(fileTree, path);
        if (!resolved) {
          dispatch(
            addLog(`touch: cannot touch '${path}': No such file or directory`),
          );
          break;
        }
        const existing = findNodeByPath(fileTree, path);
        if (existing) {
          break;
        }
        dispatch(
          createNode({
            parentId: resolved.parentId,
            name: resolved.name,
            type: "file",
          }),
        );
        dispatch(addLog(`Created file: ${path}`));
        break;
      }

      case "mkdir": {
        const path = args[0];
        if (!path) {
          dispatch(addLog("mkdir: missing operand"));
          break;
        }
        const resolved = resolvePath(fileTree, path);
        if (!resolved) {
          dispatch(
            addLog(
              `mkdir: cannot create directory '${path}': No such file or directory`,
            ),
          );
          break;
        }
        const existing = findNodeByPath(fileTree, path);
        if (existing) {
          dispatch(
            addLog(`mkdir: cannot create directory '${path}': File exists`),
          );
          break;
        }
        dispatch(
          createNode({
            parentId: resolved.parentId,
            name: resolved.name,
            type: "folder",
          }),
        );
        dispatch(addLog(`Created directory: ${path}`));
        break;
      }

      case "rm": {
        const path = args[0];
        if (!path) {
          dispatch(addLog("rm: missing operand"));
          break;
        }
        const node = findNodeByPath(fileTree, path);
        if (!node) {
          dispatch(
            addLog(`rm: cannot remove '${path}': No such file or directory`),
          );
          break;
        }
        dispatch(deleteNode(node.id));
        dispatch(addLog(`Removed: ${path}`));
        break;
      }

      case "cat": {
        const path = args[0];
        if (!path) {
          dispatch(addLog("cat: missing operand"));
          break;
        }
        const node = findNodeByPath(fileTree, path);
        if (!node) {
          dispatch(addLog(`cat: ${path}: No such file or directory`));
          break;
        }
        if (node.type === "folder") {
          dispatch(addLog(`cat: ${path}: Is a directory`));
          break;
        }
        dispatch(addLog(node.content || ""));
        break;
      }

      case "theme":
        const targetTheme = args[0]?.toLowerCase();
        if (targetTheme === "dark" || targetTheme === "light") {
          dispatch(setTheme(targetTheme));
          dispatch(addLog(`Theme changed to ${targetTheme}.`));
        } else {
          dispatch(addLog("Usage: theme <light|dark>"));
        }
        break;

      case "npm":
        if (args.join(" ") === "run dev") {
          dispatch(addLog("restarting next dev server..."));
          dispatch(addLog("ready - started server on 0.0.0.0:3000"));
          dispatch(addLog("compiled successfully in 800ms."));
          dispatch(setPreviewOpen(true));
          dispatch(setPreviewActiveTabId("preview"));
        } else {
          dispatch(
            addLog(`npm subcommand not recognized: npm ${args.join(" ")}`),
          );
        }
        break;

      case "js": {
        const expression = args.join(" ");
        if (!expression) {
          dispatch(addLog("Usage: js <javascript expression>"));
          break;
        }
        const iframe = document.querySelector(
          'iframe[title="Sandbox Live Preview"]',
        ) as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            { type: "EVAL_JS", code: expression },
            "*",
          );
        } else {
          dispatch(
            addLog(
              "error: Live Preview sandbox is not active or running. Please open it first.",
            ),
          );
        }
        break;
      }

      default:
        dispatch(addLog(`bash: command not found: ${primaryCmd}`));
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className="h-full w-full bg-bg-panel border-t border-border-primary flex flex-col overflow-hidden font-mono select-text"
    >
      {/* Terminal Title and toolbar */}
      <div className="h-8 w-full bg-bg-panel-header border-b border-border-primary flex items-center justify-between px-4 select-none shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
          <Terminal className="h-3.5 w-3.5 text-accent-primary" />
          <span>Terminal</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(clearLogs());
            }}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
            title="Clear Console"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Logs & Input */}
      <ScrollArea className="flex-1 w-full p-4">
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto space-y-1.5 pb-4"
        >
          {logs.map((log, idx) => (
            <div
              key={idx}
              className={`text-xs whitespace-pre-wrap leading-relaxed ${
                log.startsWith("$")
                  ? "text-text-primary font-semibold"
                  : log.includes("[error]")
                    ? "text-red-400"
                    : log.includes("[warning]")
                      ? "text-yellow-400"
                      : log.includes("[info]")
                        ? "text-sky-400 font-medium"
                        : "text-text-secondary"
              }`}
            >
              {log}
            </div>
          ))}

          {/* Prompt line */}
          <form
            onSubmit={handleCommandSubmit}
            className="flex items-center gap-2 mt-2"
          >
            <span className="text-xs text-accent-primary font-bold select-none">
              $
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-transparent text-xs text-text-primary border-none outline-none caret-accent-primary"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </form>
        </div>
      </ScrollArea>
    </div>
  );
}
export { addLog, clearLogs };
