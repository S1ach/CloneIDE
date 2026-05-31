"use client";

import React from "react";
import { useAppSelector } from "@/app/providers/store";
import { FileExplorer } from "./FileExplorer";
import { SearchPanel } from "./SearchPanel";
import { SettingsPanel } from "./SettingsPanel";
import { ScrollArea } from "@/shared/ui/ScrollArea";

export function Sidebar() {
  const activeView = useAppSelector((state) => state.explorer.activeView);

  const renderContent = () => {
    switch (activeView) {
      case "explorer":
        return <FileExplorer />;
      case "search":
        return <SearchPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <FileExplorer />;
    }
  };

  return (
    <div className="h-full w-full bg-bg-sidebar border-r border-border-primary flex flex-col">
      <ScrollArea className="flex-1 w-full">{renderContent()}</ScrollArea>
    </div>
  );
}
export { FileExplorer, SearchPanel, SettingsPanel };
