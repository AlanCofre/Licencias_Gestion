import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const MOCK = [
  { id: 1, type: "Licencia médica", status: "pendiente", date: "2025-08-01" },
  { id: 2, type: "Licencia médica", status: "revisada", date: "2025-07-20" },
  { id: 3, type: "Licencia larga", status: "verificada", date: "2025-06-30" },
];

export default function Historial() {
  const [search] = useSearchParams();
  const status = search.get("status") || "all";

  const filtered = status === "all" ? MOCK : MOCK.filter((m) => m.status === status);

  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <Navbar />
      <main className="container mx-auto px-6 py-12 flex-grow">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Historial</h1>
            <div className="text-sm text-gray-600">Filtro: <span className="font-medium">{status}</span></div>
          </div>

          <div className="mb-4 flex gap-3">
            <Link to="/historial" className="px-3 py-2 bg-white rounded shadow-sm text-sm">Todos</Link>
            <Link to="/historial?status=pendiente" className="px-3 py-2 bg-yellow-50 rounded shadow-sm text-sm">Pendientes</Link>
            <Link to="/historial?status=revisada" className="px-3 py-2 bg-indigo-50 rounded shadow-sm text-sm">Revisadas</Link>
            <Link to="/historial?status=verificada" className="px-3 py-2 bg-green-50 rounded shadow-sm text-sm">Verificadas</Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            {filtered.length === 0 && <div className="text-gray-600">No hay resultados.</div>}
            {filtered.map((it) => (
              <div key={it.id} className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{it.type}</div>
                  <div className="text-xs text-gray-500">Fecha: {it.date}</div>
                </div>
                <div className="text-sm">
                  <span className="px-3 py-1 rounded-full text-xs bg-gray-100">{it.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}