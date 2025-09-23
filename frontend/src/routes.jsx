import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./app.jsx";
import ComoUsar from "./pages/ComoUsar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import AppRegistro from "./pages/AppRegistro.jsx";

export default function RoutesWrapper() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/como-usar" element={<ComoUsar />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* manejar acceso directo a /public/index.html y cualquier path no encontrado */}
      <Route path="/public/index.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<ResetPassword/>} />
      <Route path="/forgot-password" element={<ForgotPassword />} /> 
      <Route path="/register" element={<AppRegistro />} />
    </Routes>
  );
}