import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import GenerarRevision from "./pages/GenerarRevision";
import ComoUsar from "./pages/ComoUsar";
import VerificarResultados from "./pages/VerificarResultados";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <Navbar />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/generar-revision" element={<GenerarRevision />} />
          <Route path="/como-usar" element={<ComoUsar />} />
          <Route path="/verificar-resultados" element={<VerificarResultados />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
