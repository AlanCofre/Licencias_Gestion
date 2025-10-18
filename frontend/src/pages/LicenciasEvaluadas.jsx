// frontend/src/pages/LicenciasEvaluadas.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:3000";

// --------- Helpers ---------
function fmtDate(d) {
  if (!d) return "-";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return d.toString().slice(0, 10);
    return date.toISOString().slice(0, 10);
  } catch {
    return d;
  }
}

// --------- Adjuntos ---------
function AttachmentView({ file }) {
  const [open, setOpen] = useState(false);
  if (!file) return <div className="text-sm text-gray-500">Sin archivo adjunto</div>;

  const filename = file.nombre_archivo || "archivo";
  const url = file.ruta_url || null;
  const mimetype = file.mimetype || "";

  const isImage =
    (mimetype && mimetype.startsWith("image/")) ||
    /\.(png|jpe?g|gif|bmp|webp)$/i.test(filename);
  const isPDF =
    (mimetype && mimetype === "application/pdf") || /\.pdf$/i.test(filename);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex-1">
          <div className="font-medium text-sm break-all">{filename}</div>
          <div className="text-xs text-gray-500">
            {isPDF ? "Documento PDF" : isImage ? "Imagen" : mimetype || "Archivo"}
          </div>
        </div>
      </div>

      {url ? (
        <div className="flex gap-2 flex-wrap">
          {(isPDF || isImage) && (
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Previsualizar
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm"
          >
            Descargar
          </a>
        </div>
      ) : (
        <div className="text-xs text-amber-600">
          * El backend no entregó URL de descarga (<code>ruta_url</code>)
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative bg-white w-11/12 h-5/6 rounded-lg overflow-hidden shadow-lg">
            {isPDF ? (
              <iframe src={url} title={filename} className="w-full h-full" />
            ) : isImage ? (
              <img src={url} alt={filename} className="w-full h-full object-contain" />
            ) : (
              <div className="p-6">
                No es posible previsualizar este tipo de archivo.
              </div>
            )}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --------- Página principal ---------
export default function LicenciasEvaluadas() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const res = await fetch(`${API_BASE}/api/licencias/detalle/${id}`, { headers });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.msg || "Error al cargar licencia");

        const l = json.licencia || json.data || {};
        const usuario = l.usuario || {};
        const archivo = l.archivo || null;

        setLicense({
          id: l.id_licencia,
          folio: l.folio,
          estado:
            l.estado === "aceptado"
              ? "Verificada"
              : l.estado === "rechazado"
              ? "Rechazada"
              : "—",
          motivo: l.motivo_rechazo || "",
          fechas: {
            emision: fmtDate(l.fecha_emision),
            inicio: fmtDate(l.fecha_inicio),
            fin: fmtDate(l.fecha_fin),
            creacion: fmtDate(l.fecha_creacion),
          },
          usuario: {
            nombre: usuario.nombre || "—",
            id: usuario.id_usuario || "—",
            facultad: usuario.facultad || "—",
            email: usuario.email || "—",
          },
          archivo,
        });
      } catch (e) {
        console.error("❌ Error al cargar detalle:", e);
        setErr(e.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLicense();
  }, [id]);

  const goBack = () => navigate("/licencia-info");

  if (loading)
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Cargando licencia...</p>
          </div>
        </main>
        <Footer />
      </div>
    );

  if (err)
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow max-w-md text-center">
            <h2 className="text-lg font-semibold mb-2">
              No se pudo cargar la licencia
            </h2>
            <p className="text-sm text-red-600 mb-4">{err}</p>
            <button
              onClick={goBack}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black"
            >
              Volver
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );

  if (!license) return null;

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">Detalle de Licencia Evaluada</h1>
                <p className="text-gray-500">ID: {license.id}</p>
              </div>
              <button
                onClick={goBack}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                ← Volver al historial
              </button>
            </div>

            {/* Estado */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                Resultado de Evaluación
              </h2>
              <div
                className={`p-4 rounded-lg border ${
                  /verificada|aceptad|aprob/i.test(license.estado)
                    ? "bg-green-50 border-green-300 text-green-800"
                    : /rechaz/i.test(license.estado)
                    ? "bg-red-50 border-red-300 text-red-800"
                    : "bg-gray-50 border-gray-300 text-gray-700"
                }`}
              >
                <p className="text-base font-semibold">
                  Estado: {license.estado || "—"}
                </p>
                {license.motivo && (
                  <p className="text-sm mt-2">Motivo: {license.motivo}</p>
                )}
              </div>
            </section>

            {/* Estudiante */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                Datos del Estudiante
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Nombre:</span>{" "}
                    {license.usuario.nombre}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">ID:</span>{" "}
                    {license.usuario.id}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Facultad:</span>{" "}
                    {license.usuario.facultad}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>{" "}
                    {license.usuario.email}
                  </div>
                </div>
              </div>
            </section>

            {/* Fechas */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                Datos de la Licencia
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg border mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Emisión:</span>{" "}
                    {license.fechas.emision}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Envío (creación):
                    </span>{" "}
                    {license.fechas.creacion}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Inicio reposo:
                    </span>{" "}
                    {license.fechas.inicio}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Fin reposo:</span>{" "}
                    {license.fechas.fin}
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                Archivo Adjunto
              </h2>
              <div className="border rounded-lg p-4">
                <AttachmentView file={license.archivo} />
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
