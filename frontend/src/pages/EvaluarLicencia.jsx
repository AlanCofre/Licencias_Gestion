// ...existing code...
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ConfirmModal from "../components/ConfirmModal";
import samplePDF from "../assets/sample.pdf";
import Toast from "../components/toast"; // añadido
import AlertaLicenciasAnual from "../components/AlertaLicenciasAnual";
import { useTranslation } from "react-i18next";

function formatFechaHora(fechaStr) {
  if (!fechaStr) return "";
  const d = new Date(fechaStr);
  if (isNaN(d)) return String(fechaStr);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function AttachmentView({ file }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  if (!file) {
    return (
      <div className="text-sm text-gray-500">
        Sin archivo adjunto
      </div>
    );
  }

  const isPDF = /application\/pdf/i.test(file.mimetype || file.nombre) || /\.pdf$/i.test(String(file.nombre));
  const isImage = /^image\//i.test(file.mimetype || file.nombre) || /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(String(file.nombre));

  const fileUrl = file.ruta_url?.startsWith("http")
    ? file.ruta_url
    : file.url ?? file.ruta_url;

  const nombre = file.nombre_archivo || file.nombre || "archivo";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex-1">
          <div className="font-medium text-sm break-all">{nombre}</div>
          <div className="text-xs text-gray-500">
            {isPDF ? "Documento PDF" : isImage ? "Imagen" : "Archivo"}
          </div>
        </div>
      </div>

      {(isPDF || isImage) ? (
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Previsualizar
          </button>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={nombre}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm"
          >
            Descargar
          </a>
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          * Este tipo de archivo no se puede previsualizar
        </div>
      )}

      {isModalOpen && fileUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="relative bg-white w-full md:w-4/5 h-5/6 rounded-lg overflow-hidden shadow-xl">
            {isPDF ? (
              <iframe
                title={nombre}
                src={fileUrl}
                className="w-full h-full"
              />
            ) : (
              <img
                src={fileUrl}
                alt={nombre}
                className="w-full h-full object-contain"
              />
            )}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 bg-gray-800 text-white rounded-full w-9 h-9 grid place-items-center hover:bg-black z-10"
              aria-label="Cerrar previsualización"
            >
              ✕
            </button>
            <a
              href={fileUrl}
              download={nombre}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow z-10"
            >
              Descargar
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvaluarLicencia() {
  const ROL_MAP = { 1: "Profesor", 2: "Estudiante", 3: "Funcionario" };

  const { id } = useParams();
  const navigate = useNavigate();

  const [licencia, setLicencia] = useState(null);
  const [license, setLicense] = useState(null);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [modal, setModal] = useState({ open: false, type: null });
  const [toast, setToast] = useState(null); // estado para Toast
  const [redireccionando, setRedireccionando] = useState(false);

  // ALERTA ANUAL +5 LICENCIAS
  const [alerta, setAlerta] = useState(null);
  const [loadingAlerta, setLoadingAlerta] = useState(false);
  const [errorAlerta, setErrorAlerta] = useState(null);

  // Cargar detalle de licencia
  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setMensaje("");
        const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
        const token = localStorage.getItem("token") || "";

        const res = await fetch(`${API}/api/licencias/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Error al obtener detalle");
        }

        const L =
          json.licencia ||
          (Array.isArray(json.detalle) && json.detalle.length
            ? json.detalle[0]
            : null);

        if (!L) throw new Error("Detalle no disponible");

        setLicencia(L);
      } catch (e) {
        setMensaje(e.message || "No se pudo cargar la licencia.");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  // Cargar alerta anual para el estudiante (id_usuario)
  useEffect(() => {
    const fetchAlerta = async () => {
      if (!licencia?.id_usuario) return;

      try {
        setLoadingAlerta(true);
        setErrorAlerta(null);
        setAlerta(null);

        const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
        const token = localStorage.getItem("token") || "";
        const anio = new Date().getFullYear();

        const url = `${API}/funcionario/estudiantes/${licencia.id_usuario}/alerta-licencias?anio=${anio}`;

        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(json?.mensaje || json?.error || `Error ${res.status}`);

        setAlerta(json?.data || null);
      } catch (err) {
        setErrorAlerta(err.message || "No se pudo cargar la alerta de licencias.");
      } finally {
        setLoadingAlerta(false);
      }
    };

    fetchAlerta();
  }, [licencia?.id_usuario]);

  const goBackToBandeja = () => navigate("/pendientes");
  const openModal = (type) => setModal({ open: true, type });
  const closeModal = () => setModal({ open: false, type: null });

  const handleConfirm = (data) => {
    if (modal.type === "reject") {
      const motivo = data?.note ?? "";
      if (!motivo || !motivo.trim()) {
        setToast({ message: "Debes indicar un motivo para rechazar", type: "error" });
        return;
      }
    }

    const action = modal.type === "accept" ? "aceptada" : "rechazada";
    console.log(`Licencia ${licencia.id} ${action}:`, data);

    setToast({ message: `Licencia ${action} exitosamente.`, type: "success" });

    // Mostrar toast de éxito
    setToast({ message: action, type: "success" });

    closeModal();
    setTimeout(() => goBackToBandeja(), 700);
  };

  const decidirLicencia = async (decision) => {
    if (!licencia) return;

    const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
    const token = localStorage.getItem("token") || "";

    const bodyDecidir =
      decision === "rechazado"
        ? { decision, motivo_rechazo: motivoRechazo }
        : { decision };

    const bodyNotificar =
      decision === "rechazado"
        ? { estado: "rechazado", motivo_rechazo: motivoRechazo }
        : {
            estado: "aceptado",
            fecha_inicio: licencia.fecha_inicio?.slice(0, 10),
            fecha_fin: licencia.fecha_fin?.slice(0, 10),
          };

    const bodyEstado =
      decision === "rechazado"
        ? { nuevo_estado: "rechazado", motivo_rechazo: motivoRechazo }
        : { nuevo_estado: "aceptado" };

    const bodyRechazar = { motivo_rechazo: motivoRechazo };

    const doFetch = async (url, method, body) => {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body ?? {}),
      });
      const json = await res.json().catch(() => ({}));
      return { res, json };
    };

    try {
      setMensaje("");
      setLoadingAccion(true);

      let { res, json } = await doFetch(
        `${API}/api/licencias/${id}/decidir`,
        "POST",
        bodyDecidir
      );

      if (res.status === 404) {
        ({ res, json } = await doFetch(
          `${API}/api/licencias/${id}/notificar`,
          "PUT",
          bodyNotificar
        ));
      }

      if (res.status === 404) {
        ({ res, json } = await doFetch(
          `${API}/api/licencias/${id}/estado`,
          "PUT",
          bodyEstado
        ));
      }

      if (res.status === 404 && decision === "rechazado") {
        ({ res, json } = await doFetch(
          `${API}/api/licencias/${id}/rechazar`,
          "POST",
          bodyRechazar
        ));
      }

      if (!res.ok) {
        throw new Error(json?.error || json?.msg || `Error ${res.status}`);
      }

      // ✅ CORREO ENVIADO EXITOSAMENTE - REDIRIGIR DESPUÉS DE MOSTRAR TOAST
      const mensajeExito =
        decision === "aceptado"
          ? "Licencia aceptada y notificada correctamente"
          : "Licencia rechazada y notificada correctamente";

      setToast({
        message: mensajeExito,
        type: "success",
      });

      // Configurar redirección automática después de 2 segundos
      setRedireccionando(true);
      setTimeout(() => {
        navigate("/licencias-por-revisar");
      }, 2000);
    } catch (e) {
      setMensaje(e.message);
      setToast({ message: e.message, type: "error" });
    } finally {
      setLoadingAccion(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <Navbar />
        <main className="flex-1 flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">
              {t("evaluarLicencia.loading")}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const lic = licencia || {};

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 w-full overflow-x-hidden dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-none">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">Evaluación de Licencia</h1>
                <p className="text-gray-500">ID de licencia: {lic.id_licencia ?? id}</p>
              </div>
              <button
                onClick={() => navigate("/licencias-por-revisar")}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors self-start sm:self-auto"
              >
                {"← "}
                {t("evaluarLicencia.backToInbox")}
              </button>
            </div>

            {mensaje && (
              <div className="mb-4 text-center text-red-600">{mensaje}</div>
            )}

            {/* ALERTA ANUAL (si excede) */}
            {licencia?.id_usuario && (
              <section className="mb-6">
                {loadingAlerta && (
                  <div className="p-3 text-sm text-gray-600 bg-gray-50 rounded border">
                    Verificando regularidad anual del estudiante…
                  </div>
                )}

                {!loadingAlerta && errorAlerta && (
                  <div className="p-3 text-sm text-red-700 bg-red-50 rounded border border-red-300">
                    No se pudo cargar la alerta de licencias.
                  </div>
                )}

                {!loadingAlerta && alerta?.excede_limite && (
                  <AlertaLicenciasAnual
                    anio={alerta.anio}
                    cantidad={alerta.cantidad}
                    limite={alerta.limite}
                  />
                )}
              </section>
            )}

            {/* Datos del Estudiante */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                Datos del Estudiante
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Nombre:</span>
                    <span className="text-gray-900">{lic.usuario?.nombre || ""}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">id_usuario:</span>
                    <span className="text-gray-900">
                      {lic.id_usuario ?? lic.usuario?.id_usuario ?? ""}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Correo:</span>
                    <span className="text-gray-900">{lic.usuario?.email || ""}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Rol:</span>
                    <span className="text-gray-900">{ROL_MAP[2]}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Datos de la Licencia */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                Datos de la Licencia
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Folio:</span>
                    <span className="text-gray-900">{lic.folio || ""}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">
                      Fecha de emisión:
                    </span>
                    <span className="text-gray-900">
                      {formatFechaHora(lic.fecha_emision)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Fecha inicio:</span>
                    <span className="text-gray-900">
                      {formatFechaHora(lic.fecha_inicio)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Fecha fin:</span>
                    <span className="text-gray-900">
                      {formatFechaHora(lic.fecha_fin)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Estado:</span>
                    <span className="text-gray-900">{lic.estado || ""}</span>
                  </div>
                  {lic.motivo_rechazo && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">
                        Motivo de rechazo:
                      </span>
                      <span className="text-gray-900">{lic.motivo_rechazo}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Archivo adjunto */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                Archivo Adjunto
              </h2>
              <div className="border rounded-lg p-4">
                <AttachmentView file={lic.archivo} />
              </div>
            </section>

            {/* Botones Aceptar / Rechazar */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
              <button
                onClick={() => decidirLicencia("aceptado")}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                disabled={loadingAccion}
              >
                {loadingAccion ? "Procesando..." : "✓ Aceptar Licencia"}
              </button>

              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Motivo de rechazo (mínimo 10 caracteres)"
                  className="w-full border rounded px-3 py-2"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                />
                <button
                  onClick={() => decidirLicencia("rechazado")}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  disabled={motivoRechazo.length < 10 || loadingAccion}
                >
                  {loadingAccion ? "Procesando..." : "✗ Rechazar Licencia"}
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Al aceptar o rechazar, podrás agregar
                comentarios que serán enviados al estudiante.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <ConfirmModal
        open={modal.open}
        title={
          modal.type === "accept"
            ? "Confirmar Aceptación"
            : "Confirmar Rechazo"
        }
        confirmLabel={
          modal.type === "accept" ? "Aceptar Licencia" : "Rechazar Licencia"
        }
        onClose={closeModal}
        onConfirm={handleConfirm}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
