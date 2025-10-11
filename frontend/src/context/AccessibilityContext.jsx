import React, { createContext, useContext, useEffect, useState } from "react";

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState("normal");
  const [largeCursor, setLargeCursor] = useState(false);

  useEffect(() => {
    // Cargar configuración desde localStorage
    const savedFontSize = localStorage.getItem("accessibility-font-size");
    const savedLargeCursor = localStorage.getItem("accessibility-large-cursor");
    
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }
    if (savedLargeCursor === "true") {
      setLargeCursor(true);
    }
  }, []);

  useEffect(() => {
    // Aplicar tamaño de fuente al documento
    const root = document.documentElement;
    
    // Remover clases anteriores de fuente
    root.classList.remove("font-size-small", "font-size-normal", "font-size-large", "font-size-extra-large");
    
    // Agregar nueva clase de fuente
    root.classList.add(`font-size-${fontSize}`);
    
    // Guardar en localStorage
    localStorage.setItem("accessibility-font-size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    // Aplicar cursor grande al documento
    const root = document.documentElement;
    
    if (largeCursor) {
      root.classList.add("large-cursor");
    } else {
      root.classList.remove("large-cursor");
    }
    
    // Guardar en localStorage
    localStorage.setItem("accessibility-large-cursor", largeCursor.toString());
  }, [largeCursor]);

  const increaseFontSize = () => {
    const sizes = ["small", "normal", "large", "extra-large"];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ["small", "normal", "large", "extra-large"];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  const resetFontSize = () => {
    setFontSize("normal");
  };

  const toggleLargeCursor = () => {
    setLargeCursor(!largeCursor);
  };

  const value = {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    largeCursor,
    toggleLargeCursor,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility debe usarse dentro de AccessibilityProvider");
  }
  return context;
};