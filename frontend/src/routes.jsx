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
import LicenseDetail from "./pages/LicenseDetail.jsx";
import VerificarResultados from "./pages/VerificarResultados.jsx";

export default function RoutesWrapper() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/como-usar" element={<ComoUsar />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* nuevas rutas */}
      <Route path="/lincencia-info" element={<AppVisualizar />} />
      <Route path="/registro" element={<AppRegistro />} />
      <Route path="/login" element={<AppLogin />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/license/:id" element={<LicenseDetail />} />
      <Route path="/verificar-resultados" element={<VerificarResultados />} />

      {/* manejar acceso directo a /public/index.html */}
      <Route path="/public/index.html" element={<Navigate to="/" replace />} />

      {/* rutas de recuperación de contraseña */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* cualquier path no encontrado */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}