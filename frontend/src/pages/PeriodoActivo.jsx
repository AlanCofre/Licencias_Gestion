import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
// Si ya tienes AuthContext como en tu Navbar, úsalo. Si no, simula user admin:
import { useAuth } from "../context/AuthContext"; // ajusta si tu hook vive en otra ruta
import { Calendar, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

/* =============================== MOCK API ===============================
   Reemplaza estas funciones por tus fetch reales:
   - GET /periodos               -> getPeriodos()
   - GET /periodos/activo        -> getPeriodoActivo()
   - PUT /periodos/{id}/activar  -> activarPeriodo(id)
========================================================================= */
const MOCK_PERIODOS = [
  { id: "2024-2", nombre: "2024-2" },
  { id: "2025-1", nombre: "2025-1" },
  { id: "2025-2", nombre: "2025-2" }
];

async function getPeriodos() {
  await new Promise((r) => setTimeout(r, 400));
  return [...MOCK_PERIODOS];
}
async function getPeriodoActivo() {
  await new Promise((r) => setTimeout(r, 300));
  // Lee de localStorage para simular persistencia
  const saved = localStorage.getItem("periodo_activo_id");
  return saved ? { id: saved } : null; // null => no hay activo
}
async function activarPeriodo(id) {
  await new Promise((r) => setTimeout(r, 500));
  // Simula posible error desde BE si envías un id inexistente
  const exists = MOCK_PERIODOS.some((p) => p.id === id);
  if (!exists) {
    const err = new Error("Periodo no encontrado");
    err.status = 404;
    err.detail = "El periodo indicado no existe";
    throw err;
  }
  // Simula error de negocio (ya está activo / regla BE)
  const current = localStorage.getItem("periodo_activo_id");
  if (current === id) {
    const err = new Error("El periodo ya está activo");
    err.status = 409;
    err.detail = "Selecciona un periodo distinto.";
    throw err;
  }
  // OK: “activa” guardando en localStorage
  localStorage.setItem("periodo_activo_id", id);
  return { ok: true };
}

/* =============================== TOAST =============================== */
function Toast({ kind = "error", title, desc, onClose }) {
  const palette =
    kind === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-red-50 border-red-200 text-red-800";
  const Icon = kind === "success" ? CheckCircle2 : XCircle;
  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border shadow-lg ${palette}`}>
      <div className="p-4 flex gap-3">
        <Icon className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          {desc && <div className="text-sm mt-0.5">{desc}</div>}
        </div>
        <button onClick={onClose} className="text-sm opacity-70 hover:opacity-100" aria-label="Cerrar">
          ✕
        </button>
      </div>
    </div>
  );
}

/* =============================== MODAL =============================== */
function ConfirmModal({ open, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600 mt-2">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================== PAGE =============================== */
export default function AdminPeriodos() {
  // Si ya tienes AuthContext, úsalo. Aquí asumimos { user?.role }:
  const { user } = (useAuth?.() ?? {});
  const role = String(user?.role || "admin").toLowerCase(); // por defecto admin para probar
  const isAdmin = role === "admin" || role === "administrador";

  const [loading, setLoading] = useState(true);
  const [periodos, setPeriodos] = useState([]);
  const [activo, setActivo] = useState(null); // {id} | null
  const [error, setError] = useState(null);

  const [toast, setToast] = useState(null);
  const closeToast = () => setToast(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toActivate, setToActivate] = useState(null); // id

  const activoNombre = useMemo(() => {
    if (!activo?.id) return null;
    return periodos.find((p) => p.id === activo.id)?.nombre ?? activo.id;
  }, [activo, periodos]);

  // Cargar lista + activo
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, act] = await Promise.all([getPeriodos(), getPeriodoActivo()]);
      setPeriodos(all);
      setActivo(act);
    } catch (e) {
      setError(e?.message || "Error al cargar periodos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Acción: solicitar confirmación
  const onAskActivate = (id) => {
    setToActivate(id);
    setConfirmOpen(true);
  };

  // Acción: activar confirmado
  const onConfirmActivate = async () => {
    if (!toActivate) return;
    setConfirmOpen(false);
    try {
      await activarPeriodo(toActivate);

      // Limpia caché simple y notifica al resto de la app:
      try {
        localStorage.removeItem("cache_periodo_activo");
      } catch {}
      const nombre = periodos.find((p) => p.id === toActivate)?.nombre || toActivate;
      window.dispatchEvent(new CustomEvent("periodoActivoChanged", { detail: { id: toActivate, nombre } }));

      setToast({ kind: "success", title: "Periodo activado", desc: `Ahora el periodo activo es ${nombre}.` });

      // Refresca FE (lista + activo):
      await refetch();
    } catch (e) {
      setToast({
        kind: "error",
        title: "No se pudo activar el periodo",
        desc: e?.detail || e?.message || "Intenta nuevamente."
      });
    } finally {
      setToActivate(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">Cargando periodos...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 w-full overflow-x-hidden dark:bg-app">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl">
          {/* Banner de advertencia si no hay periodo activo */}
          {!activo?.id && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-700" />
              <div className="text-sm">
                <div className="font-semibold">No hay un periodo activo configurado.</div>
                <div>Activa un periodo para que el resto del sistema funcione correctamente.</div>
              </div>
            </div>
          )}

          {/* Panel superior: Periodo activo */}
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Calendar className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Periodos Académicos</h1>
                  <p className="text-gray-600 mt-1">Administra el periodo activo del sistema.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activo?.id ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                    Activo: {activoNombre}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                    Sin periodo activo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de periodos */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Periodo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {periodos.map((p) => {
                    const isActive = activo?.id === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{p.nombre}</div>
                          <div className="text-xs text-gray-500">ID: {p.id}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {isActive ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200">
                              Activo
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          {isActive ? (
                            <button
                              disabled
                              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg border border-gray-200 cursor-not-allowed"
                            >
                              ✓ Actual
                            </button>
                          ) : (
                            <button
                              onClick={() => onAskActivate(p.id)}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              Activar periodo
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Link back opcional */}
          <div className="text-center mt-6">
            <Link
              to="/admin"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
            >
              Volver al panel
            </Link>
          </div>
        </div>
      </main>
      <Footer />

      {/* Modal de confirmación */}
      <ConfirmModal
        open={confirmOpen}
        title="Activar periodo"
        message={
          toActivate
            ? `¿Seguro que deseas activar el periodo ${toActivate}? Esta acción afectará a todo el sistema.`
            : "¿Activar periodo?"
        }
        confirmLabel="Activar"
        cancelLabel="Cancelar"
        onConfirm={onConfirmActivate}
        onCancel={() => {
          setConfirmOpen(false);
          setToActivate(null);
        }}
      />

      {/* Toast */}
      {toast && (
        <Toast kind={toast.kind} title={toast.title} desc={toast.desc} onClose={closeToast} />
      )}
    </div>
  );
}
