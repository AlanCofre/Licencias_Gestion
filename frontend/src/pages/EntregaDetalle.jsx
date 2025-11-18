import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import {
  FileDown,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  GraduationCap,
  Info,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";

/* ==========================
 * Config
 * ========================== */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/* ==========================
 * Normalizador BE real
 * ========================== */

function normalizeEntregaFromApi(payload) {
  if (!payload || typeof payload !== "object") return null;

  const estudiante = {
    nombre:
      payload.estudiante_nombre ||
      payload.estudianteNombre ||
      payload.alumno_nombre ||
      payload.estudiante?.nombre ||
      "Sin nombre",
    email:
      payload.estudiante_correo ||
      payload.estudianteEmail ||
      payload.alumno_correo ||
      payload.estudiante?.email ||
      null,
  };

  // Función para formatear fecha (solo fecha, sin hora)
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return null;
    }
  };

  // Función para formatear fecha y hora (para "Enviado")
  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  const fechas = {
    emision: formatDate(
      payload.fecha_emision ||
      payload.fecha_emision_licencia ||
      payload.fechas?.emision
    ),
    envio: formatDateTime(
      payload.fecha_envio ||
      payload.fecha_entrega ||
      payload.fechas?.envio ||
      payload.fecha_creacion
    ),
    inicioReposo: formatDate(
      payload.fecha_inicio_reposo ||
      payload.fecha_inicio ||
      payload.fechas?.inicioReposo
    ),
    finReposo: formatDate(
      payload.fecha_fin_reposo ||
      payload.fecha_fin ||
      payload.fechas?.finReposo
    ),
  };

  const fileInfo = payload.archivo || payload.file || payload.licenciaArchivo || null;

  let file = null;
  if (fileInfo) {
    file = {
      url: fileInfo.url || fileInfo.signedUrl || fileInfo.path || fileInfo.ruta || "",
      tipo: fileInfo.tipo || fileInfo.kind || "direct",
      filename: fileInfo.filename || fileInfo.nombre || "",
    };
  }

  return {
    id: payload.id,
    curso: payload.curso,
    periodo: payload.periodo,
    estudiante: estudiante,
    fechas: fechas,
    observacionesSecretaria: payload.observacionesSecretaria,
    estado: payload.estado,
    file: file,
    motivoMedico: payload.motivoMedico || payload.motivo_medico || null,
  };
}

/* ==========================
 * Request BE real
 * ========================== */

async function fetchEntregaDetalleApi(idEntrega, token) {
  const url = `${API_BASE}/profesor/licencias/${idEntrega}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (res.status === 404) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }

  if (res.status === 403) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  if (!res.ok) {
    const err = new Error("request_failed");
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const normalized = normalizeEntregaFromApi(data?.data || data);
  if (!normalized) {
    const err = new Error("invalid_payload");
    err.status = 500;
    throw err;
  }
  return normalized;
}

/* ==========================
 * TOAST SIMPLE
 * ========================== */

function Toast({ kind = "error", title, desc, onClose, actionLabel, onAction }) {
  const { t } = useTranslation();

  const icon =
    kind === "success" ? (
      <CheckCircle2 className="h-5 w-5" />
    ) : kind === "info" ? (
      <Info className="h-5 w-5" />
    ) : (
      <XCircle className="h-5 w-5" />
    );

  const base =
    kind === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : kind === "info"
      ? "bg-blue-50 border-blue-200 text-blue-800"
      : "bg-red-50 border-red-200 text-red-800";

  return (
    <div
      className={`fixed bottom-6 right-6 max-w-sm rounded-xl border shadow-lg ${base}`}
    >
      <div className="p-4 flex gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          {desc && <div className="text-sm opacity-90 mt-0.5">{desc}</div>}
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="mt-3 inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border bg-white/70 hover:bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              {actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-sm opacity-70 hover:opacity-100"
          aria-label={t("btn.close")}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ==========================
 * COMPONENTE PRINCIPAL
 * ========================== */

export default function ProfesorEntregaDetalle() {
  const { idEntrega } = useParams();
  const authCtx = useAuth?.();
  const user = authCtx?.user || null;
  const authToken = authCtx?.token || localStorage.getItem("token") || null;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(200); // 200 | 403 | 404 | 500
  const [entrega, setEntrega] = useState(null);

  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);

  const vistoKey = useMemo(
    () => `vista_entrega_${idEntrega}`,
    [idEntrega]
  );
  const [visto, setVisto] = useState(false);

  // Cargar detalle
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setStatus(200);
      setEntrega(null);

      try {
        const data = await fetchEntregaDetalleApi(idEntrega, authToken);

        if (!alive) return;
        setEntrega(data);
        setStatus(200);
      } catch (e) {
        if (!alive) return;
        const code = e?.status || 500;
        if (code === 404 || code === 403 || code === 500) {
          setStatus(code);
        } else {
          setStatus(500);
        }
        setEntrega(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [idEntrega, authToken, user]);

  // Marcado "visto" local (solo UI)
  useEffect(() => {
    try {
      setVisto(localStorage.getItem(vistoKey) === "true");
    } catch {}
  }, [vistoKey]);

  useEffect(() => {
    if (!loading && status === 200 && entrega) {
      try {
        localStorage.setItem(vistoKey, "true");
        setVisto(true);
      } catch {}
    }
  }, [loading, status, entrega, vistoKey]);

  const closeToast = useCallback(() => setToast(null), []);

  const handleDownload = useCallback(async () => {
    if (!entrega?.file?.url) return;
    setDownloading(true);
    setToast(null);
    try {
      const { url, tipo, filename } = entrega.file;

      if (tipo === "direct") {
        // Descarga directa - abrir en nueva pestaña
        window.open(url, '_blank');
        
        setToast({
          kind: "success",
          title: "Descarga iniciada",
          desc: "El archivo se está descargando en una nueva pestaña.",
        });
      } else {
        // Para URLs que requieren autenticación
        const downloadUrl = `${API_BASE}/api/licencias/${idEntrega}/archivo`;
        
        const res = await fetch(downloadUrl, {
          method: "GET",
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          credentials: "include",
        });

        if (!res.ok) {
          // Si falla, intentar con la URL directa como fallback
          console.warn("Fallback a descarga directa");
          window.open(url, '_blank');
        } else {
          const data = await res.json();
          if (data.ok && data.url) {
            // Usar la URL firmada de Supabase
            window.open(data.url, '_blank');
          } else {
            // Fallback a URL directa
            window.open(url, '_blank');
          }
        }

        setToast({
          kind: "success",
          title: "Descarga iniciada",
          desc: "El archivo se está descargando en una nueva pestaña.",
        });
      }
    } catch (e) {
      console.error("Error en descarga:", e);
      setToast({
        kind: "error",
        title: "Error al descargar",
        desc: "No se pudo descargar el archivo. Intente nuevamente.",
        actionLabel: "Reintentar",
        onAction: handleDownload,
      });
    } finally {
      setDownloading(false);
    }
  }, [entrega, authToken, idEntrega, API_BASE]);

  /* ==========================
   * RENDERS DE ESTADO
   * ========================== */

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">
              {t("profEntrega.loading")}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === 404) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <XCircle className="h-10 w-10 text-red-600 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t("profEntrega.notFoundTitle")}
            </h2>
            <p className="text-gray-600 mt-2">
              {t("profEntrega.notFoundDesc", { id: idEntrega })}
            </p>
            <Link
              to="/profesor/licencias"
              className="mt-6 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
            >
              {t("profEntrega.back")}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === 403) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <XCircle className="h-10 w-10 text-red-600 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t("profEntrega.noAccessTitle")}
            </h2>
            <p className="text-gray-600 mt-2">
              Esta entrega no pertenece a tus cursos. Si crees que es un error, contacta a
              Secretaría.
            </p>
            <Link
              to="/profesor/licencias"
              className="mt-6 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
            >
              {t("profEntrega.back")}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === 500 || !entrega) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <XCircle className="h-10 w-10 text-red-600 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-900">Error al cargar</h2>
            <p className="text-gray-600 mt-2">
              Ocurrió un problema al obtener el detalle de la entrega. Intenta nuevamente más
              tarde.
            </p>
            <Link
              to="/profesor/licencias"
              className="mt-6 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
            >
              Volver
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ==========================
   * DETALLE NORMAL
   * ========================== */

  const { estudiante, curso, periodo, fechas, observacionesSecretaria, estado, id, motivoMedico } =
  entrega || {};

  // Función auxiliar para mostrar fecha formateada (solo fecha)
  const mostrarFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      // Convertir de YYYY-MM-DD a formato local DD/MM/YYYY
      const [year, month, day] = fecha.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return fecha;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 w-full overflow-x-hidden dark:bg-app">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <GraduationCap className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Entrega #{id}</h1>
                    <p className="text-gray-600 mt-1">
                      {curso} · {periodo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {visto && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                      <Eye className="h-3.5 w-3.5" />
                      {t("profEntrega.badgeSeen")}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      estado === "Aceptado"
                        ? "bg-green-50 text-green-800 border-green-200"
                        : estado === "Rechazado"
                        ? "bg-red-50 text-red-800 border-red-200"
                        : "bg-yellow-50 text-yellow-800 border-yellow-200"
                    }`}
                  >
                    {estado}
                  </span>
                </div>
              </div>

              {/* Datos principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-blue-700" />
                    <h3 className="text-sm font-semibold text-blue-900">
                      {t("profEntrega.studentTitle")}
                    </h3>
                  </div>
                  <div className="text-gray-800">
                    <div className="font-medium">{estudiante?.nombre}</div>
                    {estudiante?.email && (
                      <a
                        href={`mailto:${estudiante.email}`}
                        className="text-sm text-blue-700 hover:underline"
                      >
                        {estudiante.email}
                      </a>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-indigo-700" />
                    <h3 className="text-sm font-semibold text-indigo-900">
                      {t("profEntrega.datesTitle")}
                    </h3>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-800">
                    <dt className="font-medium text-blue-700">Emisión</dt>
                    <dd>{mostrarFecha(fechas?.emision)}</dd>
                    <dt className="font-medium text-green-700">Inicio reposo</dt>
                    <dd>{mostrarFecha(fechas?.inicioReposo)}</dd>
                    <dt className="font-medium text-red-700">Fin reposo</dt>
                    <dd>{mostrarFecha(fechas?.finReposo)}</dd>
                    <dt className="font-medium text-gray-600">Enviado</dt>
                    <dd>{fechas?.envio || "-"}</dd>
                  </dl>
                </div>
              </div>

              {/* Observaciones Secretaría */}
              <div className="mt-6 bg-white p-5 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-gray-700" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t("profEntrega.secretaryObsTitle")}
                  </h3>
                </div>
                {observacionesSecretaria ? (
                  <p className="text-gray-700 leading-relaxed">
                    {observacionesSecretaria}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">
                    {t("profEntrega.secretaryObsEmpty")}
                  </p>
                )}
              </div>

              {/* Motivo médico */}
              <div className="mt-6 bg-white p-5 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-gray-700" />
                  <h3 className="text-sm font-semibold text-gray-900">Motivo médico</h3>
                </div>
                {motivoMedico ? (
                  <p className="text-gray-700 leading-relaxed">{motivoMedico}</p>
                ) : (
                  <p className="text-gray-500 text-sm">Sin motivo médico.</p>
                )}
              </div>

              {/* Acciones */}
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading || !entrega?.file?.url}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <FileDown className="h-4 w-4" />
                  {downloading
                    ? t("profEntrega.download.downloading")
                    : t("profEntrega.download.button")}
                </button>

                <div className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-700" />
                  {t("profEntrega.download.lastUpdate")}
                </div>
              </div>
            </div>
          </div>

          {/* Footer back link */}
          <div className="text-center">
            <Link
              to="/profesor/licencias"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors duration-200"
            >
              {t("profEntrega.backToList")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />

      {toast && (
        <Toast
          kind={toast.kind}
          title={toast.title}
          desc={toast.desc}
          onClose={closeToast}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
        />
      )}
    </div>
  );
}