"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  File,
  Terminal,
  Sun,
  Moon,
  Eye,
  AlignLeft,
  RefreshCw,
  Play,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import { openTab } from "@/entities/tab/model/tabs.slice";
import {
  setTheme,
  toggleMinimap,
  toggleWordWrap,
  togglePreview,
} from "@/entities/settings/model/settings.slice";
import { clearLogs } from "@/entities/terminal/model/terminal.slice";
import { setCreationNode } from "@/entities/explorer/model/explorer.slice";
import { Dialog, DialogContent } from "@/shared/ui/Dialog";
import { useKeyboardShortcut } from "@/shared/hooks/useKeyboardShortcut";
import { FileNode } from "@/entities/file/types";

interface CommandItem {
  id: string;
  name: string;
  category: "Files" | "Commands";
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const fileTree = useAppSelector((state) => state.files.tree);
  const currentTheme = useAppSelector((state) => state.settings.theme);

  // Toggle command palette via hotkey
  useKeyboardShortcut({ key: "k", meta: true }, () =>
    setIsOpen((prev) => !prev),
  );
  useKeyboardShortcut({ key: "p", ctrl: true }, () =>
    setIsOpen((prev) => !prev),
  );
  useKeyboardShortcut({ key: "p", ctrl: true, shift: true }, () =>
    setIsOpen((prev) => !prev),
  );

  // Flatten the file tree to search files
  const getFlatFiles = (nodes: FileNode[]): FileNode[] => {
    const list: FileNode[] = [];
    const traverse = (tree: FileNode[]) => {
      for (const node of tree) {
        if (node.type === "file") {
          list.push(node);
        } else if (node.children) {
          traverse(node.children);
        }
      }
    };
    traverse(nodes);
    return list;
  };

  const flatFiles = getFlatFiles(fileTree);

  // Define commands
  const commands: CommandItem[] = [
    {
      id: "toggle-theme",
      name: `Switch to ${currentTheme === "dark" ? "Light" : "Dark"} Theme`,
      category: "Commands",
      icon:
        currentTheme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        ),
      action: () => {
        dispatch(setTheme(currentTheme === "dark" ? "light" : "dark"));
      },
    },
    {
      id: "toggle-minimap",
      name: "Toggle Editor Minimap",
      category: "Commands",
      icon: <Eye className="h-4 w-4" />,
      action: () => {
        dispatch(toggleMinimap());
      },
    },
    {
      id: "toggle-wordwrap",
      name: "Toggle Editor Word Wrap",
      category: "Commands",
      icon: <AlignLeft className="h-4 w-4" />,
      action: () => {
        dispatch(toggleWordWrap());
      },
    },
    {
      id: "create-file",
      name: "Create New File",
      category: "Commands",
      icon: <File className="h-4 w-4 text-emerald-500" />,
      action: () => {
        dispatch(setCreationNode({ parentId: null, type: "file" }));
      },
    },
    {
      id: "clear-terminal",
      name: "Clear Terminal Logs",
      category: "Commands",
      icon: <Terminal className="h-4 w-4" />,
      action: () => {
        dispatch(clearLogs());
      },
    },
    {
      id: "toggle-preview",
      name: "Toggle Preview Panel",
      category: "Commands",
      icon: <Play className="h-4 w-4 text-emerald-400" />,
      action: () => {
        dispatch(togglePreview());
      },
    },
  ];

  // Map files to items
  const fileItems: CommandItem[] = flatFiles.map((file) => ({
    id: `file-${file.id}`,
    name: file.name,
    category: "Files",
    icon: <File className="h-4 w-4 text-sky-500" />,
    action: () => {
      dispatch(openTab(file.id));
    },
  }));

  const allItems = [...fileItems, ...commands];

  // Filter items based on search input
  const filteredItems = allItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Handle selected index boundings
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation inside search input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const selectedElement = container.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const elemTop = selectedElement.offsetTop;
        const elemBottom = elemTop + selectedElement.clientHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [selectedIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-xl overflow-hidden p-0 border border-border-primary bg-bg-panel/95 shadow-md">
        <div className="flex items-center border-b border-border-primary px-4 py-3">
          <Search className="mr-3 h-5 w-5 text-text-secondary" />
          <input
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-secondary outline-none"
            placeholder="Type a file name or command..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="rounded border border-border-primary px-1.5 py-0.5 text-[10px] text-text-secondary uppercase">
            esc
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-6 text-center text-sm text-text-secondary">
            No results found
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="max-h-[300px] overflow-y-auto p-2"
          >
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  item.action();
                  setIsOpen(false);
                }}
                className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  idx === selectedIndex
                    ? "bg-accent-muted text-text-primary border-l-2 border-accent-primary pl-2.5"
                    : "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-[10px] uppercase text-text-secondary font-semibold bg-hover-bg px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
