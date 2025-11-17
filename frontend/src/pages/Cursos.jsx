import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  BookOpen,
  Filter,
  Plus,
  Pencil,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  User as UserIcon,
  X,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

// ⛳ Cambia a false cuando conectes tu backend
const USE_MOCK = true;

/** ========= API LAYER ========= */
async function apiRequest(path, opts = {}) {
  if (USE_MOCK) return mockApi(path, opts);

  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const msg = await res.text();
    const err = new Error(msg || "request_failed");
    err.status = res.status;
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.blob();
}

const api = {
  getPeriodos: () => apiRequest("/admin/periodos"),
  getProfesores: () => apiRequest("/admin/profesores"),
  getCursos: ({ periodoId, profesorId }) => {
    const p = new URLSearchParams();
    if (periodoId) p.set("periodo_id", periodoId);
    if (profesorId) p.set("profesor_id", profesorId);
    const qs = p.toString();
    return apiRequest(`/admin/cursos${qs ? "?" + qs : ""}`);
  },
  createCurso: (payload) =>
    apiRequest("/admin/cursos", { method: "POST", body: JSON.stringify(payload) }),
  updateCurso: (id, payload) =>
    apiRequest(`/admin/cursos/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCurso: (id) => apiRequest(`/admin/cursos/${id}`, { method: "DELETE" }),
};

// ======= MOCKS (para desarrollo sin backend) =======
async function mockApi(path, opts = {}) {
  await new Promise((r) => setTimeout(r, 350));
  const url = new URL("http://x" + path);

  if (!window.__COURSES_MOCK__) {
    const periodos = [
      { id: "2025-1", nombre: "2025 - Semestre 1" },
      { id: "2025-2", nombre: "2025 - Semestre 2" },
      { id: "2026-1", nombre: "2026 - Semestre 1" },
    ];
    const profesores = [
      { id: "p1", nombre: "María López", email: "mlopez@uct.cl" },
      { id: "p2", nombre: "Juan Pérez", email: "jperez@uct.cl" },
      { id: "p3", nombre: "Carolina Soto", email: "csoto@uct.cl" },
      { id: "p4", nombre: "Diego Rivas", email: "drivas@uct.cl" },
    ];
    const cursos = [
      // 2025-1
      { id: "c1", codigo: "INF-101", nombre: "Intro a la Programación", seccion: "001", semestre: 1, periodo_id: "2025-1", profesor_id: "p1" },
      { id: "c2", codigo: "INF-101", nombre: "Intro a la Programación", seccion: "002", semestre: 1, periodo_id: "2025-1", profesor_id: "p2" },
      { id: "c3", codigo: "MAT-201", nombre: "Cálculo II",              seccion: "001", semestre: 3, periodo_id: "2025-1", profesor_id: "p3" },
      // 2025-2
      { id: "c4", codigo: "INF-240", nombre: "Programación Web",        seccion: "001", semestre: 4, periodo_id: "2025-2", profesor_id: "p2" },
      { id: "c5", codigo: "INF-220", nombre: "Bases de Datos",          seccion: "001", semestre: 4, periodo_id: "2025-2", profesor_id: "p1" },
      // 2026-1
      { id: "c6", codigo: "INF-310", nombre: "Sistemas Operativos",     seccion: "001", semestre: 5, periodo_id: "2026-1", profesor_id: "p4" },
    ];
    let seq = 100;
    window.__COURSES_MOCK__ = { periodos, profesores, cursos, seq };
  }
  const DB = window.__COURSES_MOCK__;

  // GETs
  if (path.startsWith("/admin/periodos")) return structuredClone(DB.periodos);
  if (path.startsWith("/admin/profesores")) return structuredClone(DB.profesores);

  if (path.startsWith("/admin/cursos") && (!opts.method || opts.method === "GET")) {
    const periodo_id = url.searchParams.get("periodo_id");
    const profesor_id = url.searchParams.get("profesor_id");
    let rows = DB.cursos.map((c) => ({
      ...c,
      profesor: structuredClone(DB.profesores.find((p) => p.id === c.profesor_id)),
    }));
    if (periodo_id) rows = rows.filter((c) => c.periodo_id === periodo_id);
    if (profesor_id) rows = rows.filter((c) => c.profesor_id === profesor_id);
    return structuredClone(rows);
  }

  // POST
  if (path === "/admin/cursos" && opts.method === "POST") {
    const body = JSON.parse(opts.body || "{}");
    const { codigo, nombre, seccion, semestre, periodo_id, profesor_id } = body || {};
    if (!codigo || !nombre || !seccion || !semestre || !periodo_id || !profesor_id) {
      const e = new Error("unprocessable");
      e.status = 422;
      throw e;
    }
    // unicidad: codigo+seccion+periodo
    const dup = DB.cursos.some(
      (c) =>
        c.codigo.trim().toLowerCase() === String(codigo).trim().toLowerCase() &&
        c.seccion.trim().toLowerCase() === String(seccion).trim().toLowerCase() &&
        c.periodo_id === periodo_id
    );
    if (dup) {
      const e = new Error("duplicate");
      e.status = 409;
      throw e;
    }
    const prof = DB.profesores.find((p) => p.id === profesor_id);
    if (!prof || !DB.periodos.find((p) => p.id === periodo_id)) {
      const e = new Error("unprocessable");
      e.status = 422;
      throw e;
    }
    const id = "c" + DB.seq++;
    const nuevo = { id, codigo, nombre, seccion: String(seccion), semestre: Number(semestre), periodo_id, profesor_id };
    DB.cursos.push(nuevo);
    return { ...nuevo, profesor: structuredClone(prof) };
  }

  // PUT
  if (path.startsWith("/admin/cursos/") && opts.method === "PUT") {
    const id = path.split("/").pop();
    const body = JSON.parse(opts.body || "{}");
    const { codigo, nombre, seccion, semestre, periodo_id, profesor_id } = body || {};
    if (!codigo || !nombre || !seccion || !semestre || !periodo_id || !profesor_id) {
      const e = new Error("unprocessable");
      e.status = 422;
      throw e;
    }
    const idx = DB.cursos.findIndex((c) => c.id === id);
    if (idx < 0) {
      const e = new Error("unprocessable");
      e.status = 422;
      throw e;
    }
    const dup = DB.cursos.some(
      (c) =>
        c.id !== id &&
        c.codigo.trim().toLowerCase() === String(codigo).trim().toLowerCase() &&
        c.seccion.trim().toLowerCase() === String(seccion).trim().toLowerCase() &&
        c.periodo_id === periodo_id
    );
    if (dup) {
      const e = new Error("duplicate");
      e.status = 409;
      throw e;
    }
    const prof = DB.profesores.find((p) => p.id === profesor_id);
    if (!prof || !DB.periodos.find((p) => p.id === periodo_id)) {
      const e = new Error("unprocessable");
      e.status = 422;
      throw e;
    }
    DB.cursos[idx] = {
      id,
      codigo,
      nombre,
      seccion: String(seccion),
      semestre: Number(semestre),
      periodo_id,
      profesor_id,
    };
    return { ...DB.cursos[idx], profesor: structuredClone(prof) };
  }

  // DELETE
  if (path.startsWith("/admin/cursos/") && opts.method === "DELETE") {
    const id = path.split("/").pop();
    const idx = DB.cursos.findIndex((c) => c.id === id);
    if (idx < 0) {
      const e = new Error("unprocessable");
      e.status = 422;
      throw e;
    }
    DB.cursos.splice(idx, 1);
    return { ok: true };
  }

  const e = new Error("not_implemented");
  e.status = 500;
  throw e;
}

// ======= UI helpers =======
function Toast({ toast, onClose }) {
  const { t } = useTranslation();
  if (!toast) return null;
  const base =
    toast.type === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-green-50 border-green-200 text-green-800";
  const Icon = toast.type === "error" ? AlertCircle : CheckCircle2;
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${base}`}>
        <Icon className="h-5 w-5 mt-0.5" />
        <div className="max-w-xs">{toast.message}</div>
        <button onClick={onClose} className="ml-2 text-xs underline decoration-dotted">
          {t("toast.close")}
        </button>
      </div>
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
          >
            <X size={16} /> {t("btn.close")}
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel,
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-red-50 to-rose-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
          >
            <X size={16} /> {t("btn.close")}
          </button>
        </div>
        <div className="p-5 text-sm text-gray-700">{message}</div>
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
          >
            {t("btn.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= PAGE =============
export default function AdminCursos() {
  const { t } = useTranslation();

  const [periodos, setPeriodos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // filtros
  const [periodoId, setPeriodoId] = useState("");
  const [profesorId, setProfesorId] = useState("");

  // modal form
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // curso o null
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    seccion: "",
    semestre: 1,
    periodo_id: "",
    profesor_id: "",
  });
  const [saving, setSaving] = useState(false);

  // eliminar
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // toasts
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  };

  // bootstrap
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ps, profs] = await Promise.all([api.getPeriodos(), api.getProfesores()]);
        if (!alive) return;
        setPeriodos(ps);
        setProfesores(profs);
        if (ps?.length && !periodoId) setPeriodoId(ps[0].id);
      } catch {
        showToast("error", t("adminCursos.toast.loadPeriodsError"));
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cargar cursos según filtros
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingList(true);
      try {
        const list = await api.getCursos({ periodoId, profesorId });
        if (!alive) return;
        setCursos(list);
      } catch {
        showToast("error", t("adminCursos.toast.loadCoursesError"));
      } finally {
        if (alive) setLoadingList(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [periodoId, profesorId, t]);

  const resetForm = (preset = {}) => {
    setForm({
      codigo: preset.codigo || "",
      nombre: preset.nombre || "",
      seccion: preset.seccion || "",
      semestre: preset.semestre || 1,
      periodo_id: preset.periodo_id || periodoId || "",
      profesor_id: preset.profesor?.id || preset.profesor_id || "",
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (curso) => {
    setEditing(curso);
    resetForm(curso);
    setModalOpen(true);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "semestre" ? Number(value) : value }));
  };

  const canSave =
    form.codigo.trim() &&
    form.nombre.trim() &&
    form.seccion.trim() &&
    Number(form.semestre) >= 1 &&
    Number(form.semestre) <= 10 &&
    form.periodo_id &&
    form.profesor_id;

  const handleSave = async (ev) => {
    ev?.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);

    const payload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      seccion: String(form.seccion).trim(),
      semestre: Number(form.semestre),
      periodo_id: form.periodo_id,
      profesor_id: form.profesor_id,
    };

    try {
      if (editing) {
        const updated = await api.updateCurso(editing.id, payload);
        setCursos((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
        showToast("success", t("adminCursos.toast.updateSuccess"));
      } else {
        const created = await api.createCurso(payload);
        setCursos((prev) => [created, ...prev]);
        showToast("success", t("adminCursos.toast.createSuccess"));
      }
      setModalOpen(false);
      setEditing(null);
    } catch (e) {
      if (e.status === 409) {
        showToast("error", t("adminCursos.toast.duplicateError"));
      } else if (e.status === 422) {
        showToast("error", t("adminCursos.toast.invalidError"));
      } else {
        showToast("error", t("adminCursos.toast.saveError"));
      }
    } finally {
      setSaving(false);
    }
  };

  // eliminar
  const askDelete = (curso) => {
    setToDelete(curso);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    const c = toDelete;
    if (!c) return;
    setConfirmOpen(false);
    setToDelete(null);
    // optimista
    const snapshot = [...cursos];
    setCursos((prev) => prev.filter((x) => x.id !== c.id));
    try {
      await api.deleteCurso(c.id);
      showToast("success", t("adminCursos.toast.deleteSuccess"));
    } catch (e) {
      setCursos(snapshot);
      if (e.status === 422) {
        showToast("error", t("adminCursos.toast.deleteInvalid"));
      } else {
        showToast("error", t("adminCursos.toast.deleteError"));
      }
    }
  };

  const filteredCount = cursos.length;

  if (loadingList) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando cursos..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />

      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BookOpen className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {t("adminCursos.title")}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {t("adminCursos.subtitle")}
                  </p>
                </div>
              </div>

              {/* Filtros */}
              <div className="mt-4 grid grid-cols-12 gap-3 items-end">
                {/* Periodo */}
                <div className="col-span-12 md:col-span-4">
                  <label htmlFor="periodo" className="block text-xs font-medium text-gray-600 mb-1">
                    {t("adminCursos.filters.period")}
                  </label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <select
                      id="periodo"
                      value={periodoId}
                      onChange={(e) => setPeriodoId(e.target.value)}
                      className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                    >
                      {periodos.length === 0 && <option>—</option>}
                      {periodos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Profesor */}
                <div className="col-span-12 md:col-span-4">
                  <label htmlFor="profesor" className="block text-xs font-medium text-gray-600 mb-1">
                    {t("adminCursos.filters.professor")}
                  </label>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                    <select
                      id="profesor"
                      value={profesorId}
                      onChange={(e) => setProfesorId(e.target.value)}
                      className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                    >
                      <option value="">
                        {t("adminCursos.filters.allProfessors")}
                      </option>
                      {profesores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Acciones y contador */}
                <div className="col-span-12 md:col-span-4">
                  <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2 md:justify-end">
                    <div className="flex items-center justify-between md:justify-end gap-2">
                      <div className="inline-flex items-center text-gray-600 text-sm px-3 py-2">
                        <Filter size={16} className="mr-2" />
                        {t("adminCursos.filters.results", { count: filteredCount })}
                      </div>
                      <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                        {t("adminCursos.actions.create")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {loadingList ? (
              <div className="flex items-center justify-center py-16 text-gray-600">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t("adminCursos.list.loading")}
              </div>
            ) : cursos.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-16">
                {t("adminCursos.list.empty")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.code")}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.name")}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.section")}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.semester")}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.period")}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.professor")}
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {cursos.map((c) => (
                      <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {c.codigo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">{c.nombre}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{c.seccion}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{c.semestre}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{c.periodo_id}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {c.profesor?.nombre}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              onClick={() => openEdit(c)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 transition-all shadow-sm"
                            >
                              <Pencil className="h-4 w-4" />
                              {t("adminCursos.actions.edit")}
                            </button>
                            <button
                              onClick={() => askDelete(c)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200 transition-all shadow-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("adminCursos.actions.delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Crear/Editar */}
        <Modal
          open={modalOpen}
          title={
            editing
              ? t("adminCursos.modal.editTitle")
              : t("adminCursos.modal.createTitle")
          }
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
        >
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("adminCursos.modal.fields.codeLabel")}
              </label>
              <input
                name="codigo"
                value={form.codigo}
                onChange={onChange}
                placeholder={t("adminCursos.modal.fields.codePlaceholder")}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("adminCursos.modal.fields.nameLabel")}
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                placeholder={t("adminCursos.modal.fields.namePlaceholder")}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("adminCursos.modal.fields.sectionLabel")}
              </label>
              <input
                name="seccion"
                value={form.seccion}
                onChange={onChange}
                placeholder={t("adminCursos.modal.fields.sectionPlaceholder")}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("adminCursos.modal.fields.semesterLabel")}
              </label>
              <input
                type="number"
                min={1}
                max={10}
                name="semestre"
                value={form.semestre}
                onChange={onChange}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("adminCursos.modal.fields.periodLabel")}
              </label>
              <select
                name="periodo_id"
                value={form.periodo_id}
                onChange={onChange}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
              >
                <option value="">
                  {t("adminCursos.modal.fields.selectPlaceholder")}
                </option>
                {periodos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("adminCursos.modal.fields.professorLabel")}
              </label>
              <select
                name="profesor_id"
                value={form.profesor_id}
                onChange={onChange}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
              >
                <option value="">
                  {t("adminCursos.modal.fields.selectPlaceholder")}
                </option>
                {profesores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditing(null);
                }}
                className="px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
              >
                {t("btn.cancel")}
              </button>
              <button
                type="submit"
                disabled={!canSave || saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing
                  ? t("adminCursos.modal.saveChanges")
                  : t("adminCursos.modal.create")}
              </button>
            </div>

            <div className="md:col-span-2 text-xs text-gray-500 pt-1">
              {t("adminCursos.modal.note")}
            </div>
          </form>
        </Modal>

        {/* Confirmación eliminar */}
        <ConfirmDialog
          open={confirmOpen}
          title={t("adminCursos.confirm.title")}
          message={t("adminCursos.confirm.message")}
          onCancel={() => {
            setConfirmOpen(false);
            setToDelete(null);
          }}
          onConfirm={doDelete}
          confirmLabel={t("adminCursos.confirm.confirm")}
        />
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
      <Footer />
    </div>
  );
}
