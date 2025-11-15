import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { ToastProvider } from "./context/ToastContext";
import AccessibilityWidget from "./components/AccessibilityWidget";
import AppRoutes from "./routes";

function App() {
  console.log("App se está renderizando"); // Debug

  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <ToastProvider>
            <AppRoutes />
            <AccessibilityWidget />
          </ToastProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;