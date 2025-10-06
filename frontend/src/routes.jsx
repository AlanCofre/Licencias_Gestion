import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard"; // alumno
import DashboardSecretary from "./pages/DashboardSecretary";
import AppLogin from "./pages/AppLogin";
import AppRegistro from "./pages/AppRegistro";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ComoUsar from "./pages/ComoUsar";
import VerificarResultados from "./pages/VerificarResultados";
import AppVisualizar from "./pages/LicenciaInfo";
import LicenseDetail from "./pages/LicenseDetail";
import LicenseDetailView from "./pages/LicenseDetailView";
import AppEditProfile from "./pages/AppEditProfile";
import GenerarRevision from "./pages/GenerarRevision";
import EvaluarLicencia from "./pages/EvaluarLicencia";
import LicenciasPorRevisar from "./pages/LicenciasPorRevisar";

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const role = String(user.role || "").toLowerCase();
  if (role === "secretaria" || role === "secretary") return <Navigate to="/secretaria" replace />;
  

  // por defecto -> alumno
  return <Navigate to="/alumno" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />

      {/* Inicios por role */}
      <Route path="/alumno" element={<Dashboard />} />
      <Route path="/secretaria" element={<DashboardSecretary />} />

      {/* Auth */}
      <Route path="/login" element={<AppLogin />} />
      <Route path="/registro" element={<AppRegistro />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Páginas comunes */}
      <Route path="/como-usar" element={<ComoUsar />} />
      <Route path="/verificar-resultados" element={<VerificarResultados />} />
      <Route path="/licencia-info" element={<AppVisualizar />} />
      <Route path="/generar-revision" element={<GenerarRevision />} />
      <Route path="/license-detail/:id" element={<LicenseDetail />} />
      <Route path="/license/:id" element={<LicenseDetailView />} />
      <Route path="/edit-profile" element={<AppEditProfile />} />
      <Route path="/evaluar/:id" element={<EvaluarLicencia />} />
      <Route path="/pendientes" element={<LicenciasPorRevisar />} />

      {/* Rutas heredadas (opcional: apuntan al dashboard de alumno) */}
      <Route path="/pendientes" element={<Dashboard />} />
      <Route path="/revisadas" element={<Dashboard />} />
      <Route path="/verificadas" element={<Dashboard />} />
      <Route path="/historial" element={<AppVisualizar />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}