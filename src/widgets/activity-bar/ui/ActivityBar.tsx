"use client";

import React from "react";
import { Files, Search, Settings, Sun, Moon, Play } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import {
  setActiveView,
  SidebarView,
} from "@/entities/explorer/model/explorer.slice";
import { setTheme, togglePreview } from "@/entities/settings/model/settings.slice";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/shared/ui/Tooltip";
import { useKeyboardShortcut } from "@/shared/hooks/useKeyboardShortcut";
import { useModKey } from "@/shared/hooks/usePlatform";

export function ActivityBar() {
  const dispatch = useAppDispatch();
  const activeView = useAppSelector((state) => state.explorer.activeView);
  const theme = useAppSelector((state) => state.settings.theme);
  const previewOpen = useAppSelector((state) => state.settings.previewOpen);

  // Keyboard shortcuts for sidebar views
  useKeyboardShortcut({ key: "e", ctrl: true, shift: true }, () => {
    dispatch(setActiveView("explorer"));
  });
  useKeyboardShortcut({ key: "f", ctrl: true, shift: true }, () => {
    dispatch(setActiveView("search"));
  });

  const mod = useModKey();

  const items: { view: SidebarView; label: string; icon: React.ReactNode }[] = [
    {
      view: "explorer",
      label: `Explorer (${mod}+Shift+E)`,
      icon: <Files className="h-5 w-5" />,
    },
    {
      view: "search",
      label: `Search Files (${mod}+Shift+F)`,
      icon: <Search className="h-5 w-5" />,
    },
    {
      view: "settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const handleThemeToggle = () => {
    dispatch(setTheme(theme === "dark" ? "light" : "dark"));
  };

  return (
    <TooltipProvider>
      <div className="flex h-full w-[50px] flex-col items-center justify-between border-r border-border-primary bg-bg-activity py-4">
        {/* Upper Icons */}
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Tooltip key={item.view} delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => dispatch(setActiveView(item.view))}
                  className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all ${activeView === item.view
                      ? "bg-accent-muted text-accent-primary"
                      : "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                    }`}
                >
                  {item.icon}
                  {activeView === item.view && (
                    <span className="absolute left-0 top-[20%] h-[60%] w-0.5 rounded bg-accent-primary" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Preview toggle button */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={() => dispatch(togglePreview())}
                className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all ${previewOpen
                    ? "bg-accent-muted text-accent-primary"
                    : "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                  }`}
              >
                <Play className="h-5 w-5" />
                {previewOpen && (
                  <span className="absolute left-0 top-[20%] h-[60%] w-0.5 rounded bg-accent-primary" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{previewOpen ? "Hide Preview" : "Show Preview"}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Lower Icons - Theme switch & Avatar */}
        <div className="flex flex-col gap-4">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={handleThemeToggle}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-hover-bg hover:text-text-primary"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Toggle Color Theme</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary font-semibold text-xs text-white shadow-sm cursor-pointer hover:opacity-90">
            CS
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
