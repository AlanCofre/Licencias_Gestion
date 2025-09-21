import React from "react";

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white"
    >
      Saltar al contenido principal
    </a>
  );
}