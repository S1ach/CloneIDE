"use client";

import React from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { ActivityBar } from "@/widgets/activity-bar/ui/ActivityBar";
import { Sidebar } from "@/widgets/sidebar/ui/Sidebar";
import { EditorLayout } from "@/widgets/editor-layout/ui/EditorLayout";
import { TerminalPanel } from "@/widgets/terminal-panel/ui/TerminalPanel";
import { PreviewPanel } from "@/widgets/preview-panel/ui/PreviewPanel";
import { CommandPalette } from "@/features/command-palette/ui/CommandPalette";
import { useAppSelector } from "@/app/providers/store";

export function IDEPage() {
  const previewOpen = useAppSelector((state) => state.settings.previewOpen);

  return (
    <div className="flex h-screen w-screen bg-bg-primary overflow-hidden">
      {/* 1. Leftmost Fixed Activity Icon Bar */}
      <ActivityBar />

      {/* 2. Resizable workspace layouts */}
      <div className="flex-1 h-full overflow-hidden">
        <Group orientation="horizontal">
          {/* Workspace File tree Sidebar Panel */}
          <Panel defaultSize="20%" minSize="15%" maxSize="35%">
            <Sidebar />
          </Panel>
          <Separator className="panel-resize-handle" />

          {/* Core Code Editor & Terminal Panel split vertically */}
          <Panel defaultSize={previewOpen ? "50%" : "80%"} minSize="30%">
            <Group orientation="vertical">
              <Panel defaultSize="70%" minSize="30%">
                <EditorLayout />
              </Panel>
              <Separator className="panel-resize-handle" />
              <Panel defaultSize="30%" minSize="15%">
                <TerminalPanel />
              </Panel>
            </Group>
          </Panel>

          {/* Right Live Preview Panel (toggleable) */}
          {previewOpen && (
            <>
              <Separator className="panel-resize-handle" />
              <Panel defaultSize="30%" minSize="20%" maxSize="50%">
                <PreviewPanel />
              </Panel>
            </>
          )}
        </Group>
      </div>

      {/* Global Modals / Feature triggers */}
      <CommandPalette />
    </div>
  );
}
