import { useEffect } from "react";

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
};

export function useKeyboardShortcut(
  combo: KeyCombo,
  callback: (e: KeyboardEvent) => void,
  disabled: boolean = false,
) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const matchKey = e.key.toLowerCase() === combo.key.toLowerCase();
      const matchCtrl = !!combo.ctrl === e.ctrlKey;
      const matchMeta = !!combo.meta === e.metaKey;
      const matchAlt = !!combo.alt === e.altKey;
      const matchShift = !!combo.shift === e.shiftKey;

      if (matchKey && matchCtrl && matchMeta && matchAlt && matchShift) {
        e.preventDefault();
        callback(e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [combo, callback, disabled]);
}
export type { KeyCombo };
