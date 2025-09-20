import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
// import Dashboard from "./pages/Dashboard";
import GenerarRevision from "./pages/GenerarRevision";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <Navbar />
      <GenerarRevision />   {/* 👈 aquí en vez de Dashboard */}
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}

export default App;
