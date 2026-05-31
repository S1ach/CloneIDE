"use client";

import React, { useState } from "react";
import { Search, FileText } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import { openTab } from "@/entities/tab/model/tabs.slice";
import { FileNode } from "@/entities/file/types";

interface SearchResult {
  file: FileNode;
  matches: {
    lineNum: number;
    text: string;
  }[];
}

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const fileTree = useAppSelector((state) => state.files.tree);
  const dispatch = useAppDispatch();

  // Recursively search files for contents matching query
  const performSearch = (
    nodes: FileNode[],
    searchTerm: string,
  ): SearchResult[] => {
    const results: SearchResult[] = [];
    if (!searchTerm.trim()) return [];

    const searchNode = (node: FileNode) => {
      if (node.type === "file" && node.content) {
        const lines = node.content.split("\n");
        const matches: { lineNum: number; text: string }[] = [];

        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
            matches.push({
              lineNum: index + 1,
              text: line.trim(),
            });
          }
        });

        if (matches.length > 0) {
          results.push({ file: node, matches });
        }
      } else if (node.children) {
        node.children.forEach(searchNode);
      }
    };

    nodes.forEach(searchNode);
    return results;
  };

  const results = performSearch(fileTree, query);

  const handleSelectMatch = (fileId: string) => {
    dispatch(openTab(fileId));
  };

  return (
    <div className="flex h-full w-full flex-col px-3 py-2">
      <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-4">
        Search files
      </span>

      {/* Search Input Box */}
      <div className="relative flex items-center border border-border-primary rounded-lg bg-bg-panel px-3 py-2 mb-4 focus-within:border-accent-primary">
        <Search className="h-4 w-4 text-text-secondary mr-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search text in workspace..."
          className="w-full bg-transparent text-xs text-text-primary outline-none"
        />
      </div>

      {/* Results viewport */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {results.map((res) => (
          <div key={res.file.id} className="space-y-1.5">
            <button
              onClick={() => handleSelectMatch(res.file.id)}
              className="flex items-center gap-1.5 text-xs text-text-primary hover:text-accent-primary font-medium w-full text-left truncate"
            >
              <FileText className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <span>{res.file.name}</span>
              <span className="text-[10px] text-text-secondary">
                ({res.matches.length})
              </span>
            </button>

            <div className="border-l border-border-primary ml-2.5 pl-3 space-y-1">
              {res.matches.map((match, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectMatch(res.file.id)}
                  className="group flex items-start gap-2 cursor-pointer hover:bg-hover-bg p-1 rounded transition-colors text-[11px]"
                >
                  <span className="text-accent-primary font-mono text-[10px] select-none mt-0.5">
                    {match.lineNum}:
                  </span>
                  <span className="text-text-secondary font-mono truncate group-hover:text-text-primary">
                    {match.text || (
                      <span className="italic opacity-60">empty line</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {query && results.length === 0 && (
          <div className="text-center text-xs text-text-secondary py-4">
            No matches found.
          </div>
        )}

        {!query && (
          <div className="text-center text-xs text-text-secondary py-4">
            Type keyword to search files contents...
          </div>
        )}
      </div>
    </div>
  );
}
