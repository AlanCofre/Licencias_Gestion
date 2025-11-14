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

/* para ver el detalle, en la url debe ir el idEntrega, ejemplo:
   /profesor/licencias/123
*/

/* -------------------- MOCK / BE SIMULADO -------------------- */

async function fetchEntregaDetalle(idEntrega) {
  await new Promise((r) => setTimeout(r, 700));
  const db = {
    "123": {
      id: "123",
      curso: "Algoritmos y Estructuras de Datos",
      periodo: "2025-2",
      profesorOwnerId: "prof-abc", // debe calzar con el user.id del profe autenticado
      estudiante: {
        nombre: "Rumencio González",
        email: "rgonzalez@alu.uct.cl",
      },
      fechas: {
        emision: "2025-09-27",
        envio: "2025-09-28",
        inicioReposo: "2025-10-01",
        finReposo: "2025-10-07",
      },
      observacionesSecretaria:
        "Documentación legible. Falta firma en pág. 2, pero se acepta.",
      estado: "En revisión",
      file: {
        url: "/api/files/licencia-123.pdf",
        tipo: "signed",
        filename: "licencia-123.pdf",
      },
    },
    "456": {
      id: "456",
      curso: "Programación I",
      periodo: "2025-2",
      profesorOwnerId: "otro-prof",
      estudiante: {
        nombre: "Carlos Rodríguez",
        email: "crodriguez@alu.uct.cl",
      },
      fechas: {
        emision: "2025-09-13",
        envio: "2025-09-14",
        inicioReposo: "2025-09-15",
        finReposo: "2025-09-20",
      },
      observacionesSecretaria: null,
      estado: "Aceptado",
      file: {
        url: "/api/files/licencia-456.pdf",
        tipo: "direct",
        filename: "licencia-456.pdf",
      },
    },
    "789": {
      id: "789",
      curso: "Derecho Civil",
      periodo: "2025-2",
      profesorOwnerId: "prof-abc", // coincide con el prof activo para permitir ver
      estudiante: {
        nombre: "Ana Martínez",
        email: "amartinez@alu.uct.cl",
      },
      fechas: {
        emision: "2025-10-01",
        envio: "2025-10-02",
        inicioReposo: "2025-10-03",
        finReposo: "2025-10-05",
      },
      observacionesSecretaria: "Adjuntar receta original si aplica.",
      estado: "Rechazado",
      file: {
        url: "/api/files/licencia-789.pdf",
        tipo: "direct",
        filename: "licencia-789.pdf",
      },
    },
  };
  if (!db[idEntrega]) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  return db[idEntrega];
}

/* -------------------- TOAST SIMPLE -------------------- */
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

/* -------------------- COMPONENTE PRINCIPAL -------------------- */
export default function ProfesorEntregaDetalle() {
  const { idEntrega } = useParams();
  const { user } = (useAuth?.() ?? {});
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(200); // 200 | 403 | 404
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
    (async () => {
      setLoading(true);
      setStatus(200);
      try {
        const data = await fetchEntregaDetalle(idEntrega);
        // regla de acceso: profesor dueño del curso
        const currentProfId = String(user?.id || "prof-abc"); // <-- ajusta al id real
        if (data.profesorOwnerId !== currentProfId) {
          if (alive) {
            setStatus(403);
            setEntrega(null);
          }
        } else {
          if (alive) {
            setEntrega(data);
            setStatus(200);
          }
        }
      } catch (e) {
        const code = e?.status || 500;
        if (alive) {
          setStatus(code === 404 ? 404 : 500);
          setEntrega(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [idEntrega, user]);

  // Marcado "visto" local (solo UI)
  useEffect(() => {
    if (!loading && status === 200) {
      try {
        localStorage.setItem(vistoKey, "true");
        setVisto(true);
      } catch {}
    }
  }, [loading, status, vistoKey]);

  useEffect(() => {
    try {
      setVisto(localStorage.getItem(vistoKey) === "true");
    } catch {}
  }, [vistoKey]);

  const closeToast = useCallback(() => setToast(null), []);

  const handleDownload = useCallback(async () => {
    if (!entrega?.file?.url) return;
    setDownloading(true);
    setToast(null);
    try {
      const { url, tipo, filename } = entrega.file;

      if (tipo === "direct") {
        // URL directa: abre nueva pestaña (o fuerza descarga con anchor)
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        // URL firmada o endpoint de descarga: baja con fetch -> blob
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const link = document.createElement("a");
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = filename || "documento.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
      }

      setToast({
        kind: "success",
        title: t("profEntrega.toast.downloadStartedTitle"),
        desc: t("profEntrega.toast.downloadStartedDesc"),
      });
    } catch (e) {
      setToast({
        kind: "error",
        title: t("profEntrega.toast.downloadErrorTitle"),
        desc: t("profEntrega.toast.downloadErrorDesc"),
        actionLabel: t("profEntrega.toast.retry"),
        onAction: handleDownload,
      });
    } finally {
      setDownloading(false);
    }
  }, [entrega, t]);

  /* -------------------- RENDERS DE ESTADO -------------------- */

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
              {t("profEntrega.noAccessDesc")}
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

  /* -------------------- DETALLE -------------------- */
  const {
    estudiante,
    curso,
    periodo,
    fechas,
    observacionesSecretaria,
    estado,
    id,
  } = entrega || {};

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
                    <h1 className="text-3xl font-bold text-gray-900">
                      {t("profEntrega.headerTitle", { id })}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {t("profEntrega.headerSubtitle", {
                        course: curso,
                        period: periodo,
                      })}
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
                    <dt className="font-medium text-blue-700">
                      {t("profEntrega.dates.emission")}
                    </dt>
                    <dd>{fechas?.emision}</dd>
                    <dt className="font-medium text-green-700">
                      {t("profEntrega.dates.startRest")}
                    </dt>
                    <dd>{fechas?.inicioReposo}</dd>
                    <dt className="font-medium text-red-700">
                      {t("profEntrega.dates.endRest")}
                    </dt>
                    <dd>{fechas?.finReposo}</dd>
                    <dt className="font-medium text-gray-600">
                      {t("profEntrega.dates.sent")}
                    </dt>
                    <dd>{fechas?.envio}</dd>
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

              {/* Acciones */}
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
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
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
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
