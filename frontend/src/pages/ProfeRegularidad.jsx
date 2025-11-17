import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AlertaLicenciasAnual from "../components/AlertaLicenciasAnual";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useLicenciasporAño } from "../hooks/useLicenciasporAño";
import { Clock, Search, Eye } from "lucide-react";

const TOTAL_CLASSES_PERIOD = 20;
const ATTENDANCE_THRESHOLD_PERCENT = 80;

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
    // many validated days -> at risk + EXCEDE 5 LICENCIAS
    licenses: [
      { id: "789", estado: "validated", fechaEmision: "2025-01-15" },
      { id: "790", estado: "validated", fechaEmision: "2025-02-20" },
      { id: "791", estado: "validated", fechaEmision: "2025-03-10" },
      { id: "792", estado: "validated", fechaEmision: "2025-04-05" },
      { id: "793", estado: "validated", fechaEmision: "2025-05-12" },
      { id: "794", estado: "validated", fechaEmision: "2025-06-18" },
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
  const [loading, setLoading] = useState(true);
  const role = String(user?.role || "").toLowerCase();
  const isTeacher = role === "profesor" || role === "teacher";
  const isAdmin = role === "admin" || role === "administrador" || role === "administrator";
  const año = new Date().getFullYear();

  const [filterCourse, setFilterCourse] = useState("");
  const [search, setSearch] = useState("");

  const courseOptions = useMemo(() => {
    const s = new Set(studentsMock.map((x) => `${x.course} - ${x.section}`));
    return Array.from(s);
  }, []);

  const enriched = useMemo(() => {
    return studentsMock.map((st) => {
      const validated = st.licenses.filter((l) => l.estado === "validated");
      const lastUpload = st.licenses.reduce((acc, l) => (!acc || new Date(l.fechaEmision) > new Date(acc) ? l.fechaEmision : acc), null);

      const thirtyAgo = new Date();
      thirtyAgo.setDate(thirtyAgo.getDate() - 30);
      const uploadedLastMonth = st.licenses.filter((l) => new Date(l.fechaEmision) >= thirtyAgo).length;

      const missedDays = validated.reduce((sum, l) => sum + daysBetween(l.inicio, l.fin), 0);
      const missedPercent = Math.min(100, Math.round((missedDays / TOTAL_CLASSES_PERIOD) * 100));

      const hasAffecting = validated.length > 0;
      const status = hasAffecting ? "Regular" : (st.licenses.some((l) => l.estado === "rejected") ? "Rechazada" : "Regular");

      // Calcula licencias por año
      const licporAño = useLicenciasporAño(st.licenses);
      const cantidadAño = (licporAño[año] || []).length;
      const excedeLicencias = cantidadAño > 5;

      return { ...st, validated, lastUpload, uploadedLastMonth, missedDays, missedPercent, status, licporAño, cantidadAño, excedeLicencias };
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

  useEffect(() => {
    const loadData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando regularidad de estudiantes..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        <div className="bg-white dark:bg-surface rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold dark:text-blue-200">Regularidad — Mis estudiantes</h1>
              <p className="text-gray-600 dark:text-muted">Lista de estudiantes de tus ramos y estado de regularidad basado en licencias validadas.</p>
            </div>
          </div>

          <div className="mt-4 flex gap-4 flex-wrap items-center">
            <div>
              <label className="text-sm text-gray-600 dark:text-muted">Ramo</label>
              <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="ml-2 border dark:border-app dark:bg-surface dark:text-white px-2 py-1 rounded">
                <option value="">Todos</option>
                {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="relative">
              <input placeholder="Buscar alumno o legajo" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 py-1 border dark:border-app dark:bg-surface dark:text-white rounded" />
              <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-app/40">
              <tr>
                <th className="text-left px-6 py-3 dark:text-blue-200">Estudiante</th>
                <th className="text-left px-6 py-3 dark:text-blue-200">Ramo</th>
                <th className="text-left px-6 py-3 dark:text-blue-200">Última subida</th>
                <th className="text-left px-6 py-3 dark:text-blue-200">Licencias (30d)</th>
                <th className="text-left px-6 py-3 dark:text-blue-200">Faltas estimadas</th>
                <th className="text-left px-6 py-3 w-32 dark:text-blue-200">Estado</th>
                <th className="px-6 py-3 text-center dark:text-blue-200">Acción</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((s) => (
                <React.Fragment key={s.id}>
                  <tr className="hover:bg-blue-50 dark:hover:bg-app/20 border-b dark:border-app">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-blue-800 dark:text-blue-300">{initialsFromName(s.name)}</div>
                        <div>
                          <div className="font-medium dark:text-white">{s.name}</div>
                          <div className="text-xs text-gray-500 dark:text-muted">{s.legajo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 dark:text-white">
                      <div className="font-medium">{s.course} · {s.section}</div>
                    </td>
                    <td className="px-6 py-4 dark:text-white">{s.lastUpload || "-"}</td>
                    <td className="px-6 py-4 dark:text-white">{s.uploadedLastMonth}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm dark:text-white">
                        <div>{s.missedDays} días</div>
                        <div className="text-xs text-gray-500 dark:text-muted">{s.missedPercent}% del periodo</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center min-w-[120px] px-4 py-2 rounded-full text-sm font-semibold ${
                        s.missedPercent >= ATTENDANCE_THRESHOLD_PERCENT ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" :
                        s.status === "Afecta" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" :
                        "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      }`}>
                        {s.missedPercent >= ATTENDANCE_THRESHOLD_PERCENT ? "En riesgo" : s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link to={`/profesor/regularidad/${s.id}`} className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded hover:from-blue-700 hover:to-indigo-700">
                        <Eye className="h-4 w-4" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                  {/* Fila expandida con alerta de licencias anuales si excede */}
                  {s.excedeLicencias && (
                    <tr className="bg-red-50 dark:bg-red-900/20">
                      <td colSpan={7} className="px-6 py-3">
                        <AlertaLicenciasAnual licenciasporAño={s.licporAño} año={año} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-600 dark:text-muted">
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