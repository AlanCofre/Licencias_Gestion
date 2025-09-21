import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./app.jsx";
import ComoUsar from "./pages/ComoUsar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Historial from "./pages/Historial.jsx";
import LicenseDetail from "./pages/LicenseDetail.jsx";

export default function RoutesWrapper() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/como-usar" element={<ComoUsar />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/historial" element={<Historial />} />
      <Route path="/licencias/:id" element={<LicenseDetail />} />
      <Route path="/public/index.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}