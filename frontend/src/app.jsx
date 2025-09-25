import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import NavbarC from "./components/NavbarCalendar";
import EditProfile from "./pages/AppEditProfile";
import AppLogin from "./pages/AppLogin";
import GenerarRevision from "./pages/GenerarRevision";
import AppRegistro from "./pages/AppRegistro";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AppVisualizar from "./pages/LicenciaInfo";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <NavbarC />
      <AppVisualizar />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}

export default App;