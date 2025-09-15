import React from "react";
import NavbarSecretaria from "./components/NavbarSecretaria";
import Footer from "./components/Footer";
import DashboardSecretaria from "./pages/DashboardSecretaria";

function AppSecretaria() {
  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <NavbarSecretaria />
      <DashboardSecretaria />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}

export default AppSecretaria;