"use client";

import { useState, useEffect } from "react";

/**
 * Returns true if the user is on macOS.
 * Uses navigator.platform / navigator.userAgent for detection.
 * During SSR, returns false (defaults to Windows/Linux).
 */
export function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const platform =
      // @ts-expect-error — userAgentData is experimental
      navigator.userAgentData?.platform ?? navigator.platform ?? "";
    setIsMac(/mac/i.test(platform));
  }, []);

  return isMac;
}

/**
 * Returns the platform-correct modifier key label.
 * Mac: ⌘  |  Windows/Linux: Ctrl
 */
export function useModKey(): string {
  const isMac = useIsMac();
  return isMac ? "⌘" : "Ctrl";
}
