import React, { createContext, useContext, useEffect, useState } from "react";

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState("normal");

  useEffect(() => {
    // Cargar configuración desde localStorage
    const savedFontSize = localStorage.getItem("accessibility-font-size");
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }
  }, []);

  useEffect(() => {
    // Aplicar tamaño de fuente al documento
    const root = document.documentElement;
    
    // Remover clases anteriores
    root.classList.remove("font-size-small", "font-size-normal", "font-size-large", "font-size-extra-large");
    
    // Agregar nueva clase
    root.classList.add(`font-size-${fontSize}`);
    
    // Guardar en localStorage
    localStorage.setItem("accessibility-font-size", fontSize);
  }, [fontSize]);

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

  const value = {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
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