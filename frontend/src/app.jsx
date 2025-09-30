import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import SkipLink from "./components/SkipLink";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen">
          <SkipLink />
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;