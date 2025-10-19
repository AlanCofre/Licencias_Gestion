import React, { createContext, useState, useEffect, useCallback, useContext } from "react";

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  // font size: "small" | "normal" | "large" | "extra-large"
  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem("fontSize") || "normal";
    } catch {
      return "normal";
    }
  });

  const [largeCursor, setLargeCursor] = useState(() => {
    try {
      return localStorage.getItem("largeCursor") === "true";
    } catch {
      return false;
    }
  });

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("darkMode") === "true";
    } catch {
      return false;
    }
  });

  // Persist and apply dark mode class on <html>
  useEffect(() => {
    try {
      localStorage.setItem("darkMode", darkMode ? "true" : "false");
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", !!darkMode);
    }
  }, [darkMode]);

  // Persist and apply large cursor
  useEffect(() => {
    try {
      localStorage.setItem("largeCursor", largeCursor ? "true" : "false");
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("large-cursor", !!largeCursor);
    }
  }, [largeCursor]);

  // Persist and apply font size as class on root (font-size-normal etc)
  useEffect(() => {
    try {
      localStorage.setItem("fontSize", fontSize);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove(
        "font-size-small",
        "font-size-normal",
        "font-size-large",
        "font-size-extra-large"
      );
      document.documentElement.classList.add(`font-size-${fontSize}`);
    }
  }, [fontSize]);

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      const order = ["small", "normal", "large", "extra-large"];
      const idx = Math.min(order.length - 1, Math.max(0, order.indexOf(prev)));
      return order[Math.min(order.length - 1, idx + 1)];
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      const order = ["small", "normal", "large", "extra-large"];
      const idx = Math.min(order.length - 1, Math.max(0, order.indexOf(prev)));
      return order[Math.max(0, idx - 1)];
    });
  }, []);

  const resetFontSize = useCallback(() => setFontSize("normal"), []);

  const toggleLargeCursor = useCallback(() => setLargeCursor((v) => !v), []);
  const toggleDarkMode = useCallback(() => setDarkMode((v) => !v), []);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        largeCursor,
        toggleLargeCursor,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);