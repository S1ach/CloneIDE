"use client";

import React from "react";
import { Sun, Moon, Type, Layout, Eye, WrapText } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/providers/store";
import {
  setTheme,
  setFontSize,
  toggleWordWrap,
  toggleMinimap,
} from "@/entities/settings/model/settings.slice";

export function SettingsPanel() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.settings.theme);
  const fontSize = useAppSelector((state) => state.settings.fontSize);
  const wordWrap = useAppSelector((state) => state.settings.wordWrap);
  const minimap = useAppSelector((state) => state.settings.minimap);

  const fontSizes = [12, 14, 16, 18, 20];

  return (
    <div className="flex h-full w-full flex-col px-4 py-2 space-y-6">
      <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">
        Settings
      </span>

      {/* Editor Customizer Section */}
      <div className="space-y-4">
        {/* Theme Toggle option */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary flex items-center gap-2">
            <Sun className="h-3.5 w-3.5" /> Color Theme
          </label>
          <div className="grid grid-cols-2 gap-2 bg-bg-panel p-1 rounded-lg border border-border-primary">
            <button
              onClick={() => dispatch(setTheme("dark"))}
              className={`flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                theme === "dark"
                  ? "bg-accent-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Moon className="h-3.5 w-3.5" /> Dark
            </button>
            <button
              onClick={() => dispatch(setTheme("light"))}
              className={`flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                theme === "light"
                  ? "bg-accent-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Sun className="h-3.5 w-3.5" /> Light
            </button>
          </div>
        </div>

        {/* Font size dropdown selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary flex items-center gap-2">
            <Type className="h-3.5 w-3.5" /> Font Size
          </label>
          <select
            value={fontSize}
            onChange={(e) => dispatch(setFontSize(Number(e.target.value)))}
            className="w-full bg-input-bg text-text-primary text-xs border border-input-border px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-accent-primary"
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-border-primary my-4" />

        {/* Layout & Editor Features options */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-text-secondary flex items-center gap-2 mb-1">
            <Layout className="h-3.5 w-3.5" /> Editor Preferences
          </label>

          {/* Minimap toggle check */}
          <div
            onClick={() => dispatch(toggleMinimap())}
            className="flex items-center justify-between p-2 rounded-md hover:bg-hover-bg cursor-pointer select-none"
          >
            <span className="text-xs text-text-primary flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-text-secondary" /> Show Minimap
            </span>
            <input
              type="checkbox"
              checked={minimap}
              onChange={() => {}} // Redux handler is bound on container div click
              className="accent-accent-primary pointer-events-none"
            />
          </div>

          {/* Wordwrap toggle check */}
          <div
            onClick={() => dispatch(toggleWordWrap())}
            className="flex items-center justify-between p-2 rounded-md hover:bg-hover-bg cursor-pointer select-none"
          >
            <span className="text-xs text-text-primary flex items-center gap-2">
              <WrapText className="h-3.5 w-3.5 text-text-secondary" /> Enable
              Word Wrap
            </span>
            <input
              type="checkbox"
              checked={wordWrap}
              onChange={() => {}}
              className="accent-accent-primary pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
