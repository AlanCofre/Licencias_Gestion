import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./app.jsx";
import ComoUsar from "./pages/ComoUsar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import AppVisualizar from "./pages/LicenciaInfo.jsx";
import AppRegistro from "./pages/AppRegistro.jsx";
import AppLogin from "./pages/AppLogin.jsx";
import EditProfile from "./pages/AppEditProfile.jsx";
import VerificarResultados from "./pages/VerificarResultados.jsx";
import LicenseDetail from "./pages/LicenseDetail";

export default function RoutesWrapper() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<AppLogin />} />
      <Route path="/registro" element={<AppRegistro />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/como-usar" element={<ComoUsar />} />
      <Route path="/verificar-resultados" element={<VerificarResultados />} />
      <Route path="/licencia-info" element={<AppVisualizar />} />
      <Route path="/license-detail/:id" element={<LicenseDetail />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/pendientes" element={<Dashboard />} />
      <Route path="/revisadas" element={<Dashboard />} />
      <Route path="/verificadas" element={<Dashboard />} />
      <Route path="/historial" element={<Dashboard />} />
      <Route path="/generar-revision" element={<VerificarResultados />} />

      {/* manejar acceso directo a /public/index.html */}
      <Route path="/public/index.html" element={<Navigate to="/" replace />} />

      {/* cualquier path no encontrado */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}