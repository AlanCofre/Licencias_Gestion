import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { Clock, Search, Eye } from "lucide-react";

const TOTAL_CLASSES_PERIOD = 20; // ejemplo: total de clases en el periodo activo
const ATTENDANCE_THRESHOLD_PERCENT = 80; // % para considerar en riesgo

const studentsMock = [
  {
    id: "s1",
    name: "Rumencio González",
    legajo: "20201234",
    course: "INF101",
    section: "A",
    licenses: [
      { id: "123", estado: "validated", fechaEmision: "2025-09-27", inicio: "2025-10-01", fin: "2025-10-03" },
      { id: "124", estado: "rejected", fechaEmision: "2025-08-10", inicio: "2025-08-11", fin: "2025-08-12" }
    ]
  },
  {
    id: "s2",
    name: "Carlos Rodríguez",
    legajo: "20195678",
    course: "INF101",
    section: "A",
    licenses: [
      { id: "456", estado: "validated", fechaEmision: "2025-09-13", inicio: "2025-09-15", fin: "2025-09-16" }
    ]
  },
  {
    id: "s3",
    name: "Ana Martínez",
    legajo: "20221122",
    course: "DER201",
    section: "B",
    // many validated days -> at risk
    licenses: [
      { id: "789", estado: "validated", fechaEmision: "2025-10-01", inicio: "2025-09-01", fin: "2025-09-20" },
      { id: "790", estado: "validated", fechaEmision: "2025-10-05", inicio: "2025-10-01", fin: "2025-10-05" }
    ]
  }
];

function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function daysBetween(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da) || isNaN(db)) return 0;
  return Math.max(0, Math.round((db - da) / (24 * 3600 * 1000)) + 1);
}

export default function ProfesorRegularidad() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = String(user?.role || "").toLowerCase();
  const isTeacher = role === "profesor" || role === "teacher";
  const isAdmin = role === "admin" || role === "administrador" || role === "administrator";

/*  ESTO VERIFICA QUE SEA PROFESOR O ADMIN, SI NO LO ES, NO PUEDE VER LA PAGINA, DESCOMENTAR PARA TESTEAR

  if (!isTeacher && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <h2 className="text-xl font-bold">Acceso denegado</h2>
            <p className="text-gray-600 mt-2">Esta página solo está disponible para Profesores y Administradores.</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 rounded border bg-white">Volver</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  } */

  const [filterCourse, setFilterCourse] = useState("");
  const [search, setSearch] = useState("");

  const courseOptions = useMemo(() => {
    const s = new Set(studentsMock.map((x) => `${x.course} - ${x.section}`));
    return Array.from(s);
  }, []);

  const enriched = useMemo(() => {
    return studentsMock.map((st) => {
      // validated licenses within "periodo activo" (simulación: todas las validated)
      const validated = st.licenses.filter((l) => l.estado === "validated");
      const lastUpload = st.licenses.reduce((acc, l) => (!acc || new Date(l.fechaEmision) > new Date(acc) ? l.fechaEmision : acc), null);

      // count in last 30 days
      const thirtyAgo = new Date();
      thirtyAgo.setDate(thirtyAgo.getDate() - 30);
      const uploadedLastMonth = st.licenses.filter((l) => new Date(l.fechaEmision) >= thirtyAgo).length;

      // missed days sum (only validated)
      const missedDays = validated.reduce((sum, l) => sum + daysBetween(l.inicio, l.fin), 0);
      const missedPercent = Math.min(100, Math.round((missedDays / TOTAL_CLASSES_PERIOD) * 100));

      // decide status: affected if any validated overlapping (we treat validated as affecting)
      const hasAffecting = validated.length > 0;
      const status = hasAffecting ? "Regular" : (st.licenses.some((l) => l.estado === "rejected") ? "Rechazada" : "Regular");

      return { ...st, validated, lastUpload, uploadedLastMonth, missedDays, missedPercent, status };
    });
  }, []);

  const filtered = useMemo(() => {
    return enriched.filter((s) => {
      if (filterCourse && `${s.course} - ${s.section}` !== filterCourse) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.legajo.toLowerCase().includes(q);
      }
      return true;
    });
  }, [enriched, filterCourse, search]);

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Regularidad — Mis estudiantes</h1>
              <p className="text-gray-600">Lista de estudiantes de tus ramos y estado de regularidad basado en licencias validadas.</p>
            </div>
          </div>

          <div className="mt-4 flex gap-4 flex-wrap items-center">
            <div>
              <label className="text-sm text-gray-600">Ramo</label>
              <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="ml-2 border px-2 py-1 rounded">
                <option value="">Todos</option>
                {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="relative">
              <input placeholder="Buscar alumno o legajo" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 py-1 border rounded" />
              <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3">Estudiante</th>
                <th className="text-left px-6 py-3">Ramo</th>
                <th className="text-left px-6 py-3">Última subida</th>
                <th className="text-left px-6 py-3">Licencias (30d)</th>
                <th className="text-left px-6 py-3">Faltas estimadas</th>
                <th className="text-left px-6 py-3 w-32">Estado</th>
                <th className="px-6 py-3 text-center">Acción</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-800">{initialsFromName(s.name)}</div>
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.legajo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{s.course} · {s.section}</div>
                  </td>
                  <td className="px-6 py-4">{s.lastUpload || "-"}</td>
                  <td className="px-6 py-4">{s.uploadedLastMonth}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>{s.missedDays} días</div>
                      <div className="text-xs text-gray-500">{s.missedPercent}% del periodo</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center min-w-[120px] px-4 py-2 rounded-full text-sm font-semibold ${
                      s.missedPercent >= ATTENDANCE_THRESHOLD_PERCENT ? "bg-red-100 text-red-800" :
                      s.status === "Afecta" ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {s.missedPercent >= ATTENDANCE_THRESHOLD_PERCENT ? "En riesgo" : s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link to={`/profesor/regularidad/${s.id}`} className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded">
                      <Eye className="h-4 w-4" /> {/* icono del ojo */}
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-600">
                    No se encontraron estudiantes para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}