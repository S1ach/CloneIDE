"use client";

import React from "react";
import { FileClock, RotateCcw, Trash2, Eye, EyeOff, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import { findNodeById, updateContent } from "@/entities/file/model/files.slice";
import { addLog } from "@/entities/terminal/model/terminal.slice";
import {
  addRecord,
  selectRecord,
  clearHistoryForFile,
} from "@/entities/history/model/history.slice";
import { setDirty } from "@/entities/editor/model/editor.slice";

export function HistoryPanel() {
  const dispatch = useAppDispatch();
  const fileTree = useAppSelector((state) => state.files.tree);
  const activeTabId = useAppSelector((state) => state.tabs.active);

  const activeFile = activeTabId ? findNodeById(fileTree, activeTabId) : null;

  const records = useAppSelector(
    (state) => state.history.records[activeFile?.id || ""] || [],
  );
  const selectedRecordId = useAppSelector(
    (state) => state.history.selectedRecordId,
  );
  const diffActive = useAppSelector((state) => state.history.diffActive);

  const formatTime = (timestamp: number) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - timestamp;
    if (diff < 15000) return "Just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleTakeSnapshot = () => {
    if (activeFile) {
      dispatch(
        addRecord({ fileId: activeFile.id, content: activeFile.content }),
      );
      dispatch(
        addLog(
          `[info] Created manual history snapshot for: ${activeFile.name}`,
        ),
      );
    }
  };

  const handleClearHistory = () => {
    if (activeFile) {
      dispatch(clearHistoryForFile(activeFile.id));
      dispatch(addLog(`[info] Cleared file history for: ${activeFile.name}`));
    }
  };

  const handleSelectRecord = (recordId: string) => {
    if (selectedRecordId === recordId && diffActive) {
      // Toggle off if already selected and active
      dispatch(selectRecord(null));
    } else {
      dispatch(selectRecord(recordId));
    }
  };

  const handleRestoreRecord = (
    e: React.MouseEvent,
    content: string,
    label: string,
  ) => {
    e.stopPropagation(); // prevent triggering selectRecord diff toggle
    if (activeFile) {
      dispatch(updateContent({ id: activeFile.id, content }));
      dispatch(setDirty(false));
      dispatch(selectRecord(null));
      dispatch(addLog(`[info] Restored ${activeFile.name} to ${label}`));
    }
  };

  if (!activeFile) {
    return (
      <div className="flex h-full w-full flex-col px-3 py-4 items-center justify-center text-center select-none text-text-secondary">
        <FileClock className="h-8 w-8 text-text-secondary/40 mb-3" />
        <span className="text-xs">No active file open</span>
        <span className="text-[10px] opacity-60 max-w-[180px] mt-1">
          Open a file from the explorer sidebar to view its revision timeline.
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col px-3 py-2">
      <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-4">
        File History
      </span>

      {/* Active File Info Banner */}
      <div className="flex items-center justify-between bg-bg-panel border border-border-primary rounded-lg px-3 py-2 mb-4 select-none">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
            Active File
          </span>
          <span className="text-xs font-semibold text-text-primary truncate mt-0.5">
            {activeFile.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleTakeSnapshot}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
            title="Take manual snapshot"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleClearHistory}
            className="p-1 rounded text-text-secondary hover:text-red-500 hover:bg-hover-bg transition-colors"
            title="Clear file history"
            disabled={records.length === 0}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* History timeline log items */}
      <div className="flex-1 overflow-y-auto pr-1">
        {records.length === 0 ? (
          <div className="text-center text-xs text-text-secondary py-8 italic select-none">
            No history recorded yet.
            <br />
            Press{" "}
            <kbd className="bg-hover-bg px-1 rounded text-[10px] border border-border-primary">
              Ctrl+S
            </kbd>{" "}
            to save a snapshot.
          </div>
        ) : (
          <div className="relative border-l border-border-primary/50 ml-3.5 pl-4 py-2 space-y-4">
            {records.map((rec, idx) => {
              const revNum = records.length - idx;
              const revLabel = `Rev #${revNum}`;
              const isSelected = selectedRecordId === rec.id && diffActive;

              return (
                <div key={rec.id} className="relative group">
                  {/* Timeline bullet dot */}
                  <span
                    className={`absolute -left-[22px] top-1.5 h-3 w-3 rounded-full border-2 transition-all ${
                      isSelected
                        ? "bg-accent-primary border-accent-primary scale-110 shadow-sm"
                        : "bg-bg-sidebar border-border-primary group-hover:border-text-secondary"
                    }`}
                  />

                  {/* Revision Card */}
                  <div
                    onClick={() => handleSelectRecord(rec.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-accent-muted border-accent-primary/60 text-text-primary"
                        : "bg-bg-panel border-border-primary/50 text-text-secondary hover:border-border-primary hover:text-text-primary"
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                        {revLabel}
                        {idx === 0 && (
                          <span className="text-[9px] bg-accent-primary/10 text-accent-primary font-bold px-1 rounded uppercase tracking-wide">
                            Latest
                          </span>
                        )}
                      </span>
                      <span
                        className="text-[10px] text-text-secondary mt-0.5 truncate"
                        title={new Date(rec.timestamp).toLocaleString()}
                      >
                        {formatTime(rec.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRecord(rec.id);
                        }}
                        className={`p-1 rounded hover:bg-hover-bg transition-colors ${
                          isSelected
                            ? "text-accent-primary"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                        title={
                          isSelected
                            ? "Close Diff view"
                            : "View diff comparison"
                        }
                      >
                        {isSelected ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) =>
                          handleRestoreRecord(e, rec.content, revLabel)
                        }
                        className="p-1 rounded text-text-secondary hover:text-emerald-500 hover:bg-hover-bg transition-colors"
                        title="Restore this version"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
