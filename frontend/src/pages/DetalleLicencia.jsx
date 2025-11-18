// src/pages/DetalleLicencia.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";


// ---------- utils ----------
function isPDF(nameOrMime = "") {
  return /application\/pdf/i.test(nameOrMime) || /\.pdf$/i.test(String(nameOrMime));
}
function isImage(nameOrMime = "") {
  return /^image\//i.test(nameOrMime) || /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(String(nameOrMime));
}
function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (!isNaN(d)) return d.toISOString().slice(0, 10); // YYYY-MM-DD
  return dateStr;
}
function fmtDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (!isNaN(d)) {
    const iso = d.toISOString();
    return iso.slice(0, 10) + " " + iso.slice(11, 16); // YYYY-MM-DD HH:MM
  }
  return dateStr;
}
const notEmpty = (s) => (s && String(s).trim() !== "" ? s : undefined);

// ---------- Normaliza distintas respuestas del backend ----------
function normalizeDetalle(apiPayload) {
  // Admite {ok,data}, {data} o el objeto directo
  const root = apiPayload?.data ?? apiPayload;

  // Algunos controladores devuelven {licencia, archivos:[...]} o campos planos
  const lic = root?.licencia ?? root;

  // Campos esperados de licenciamedica
  const id = lic?.id_licencia ?? lic?.id ?? lic?.licencia_id ?? null;
  const folio = lic?.folio ?? lic?.nro_folio ?? null;
  const estado = lic?.estado ?? null;
  const motivoRechazo = lic?.motivo_rechazo ?? lic?.motivoRechazo ?? null;

  // Fechas (BD: fecha_inicio (date), fecha_fin (date), fecha_creacion (datetime))
  const fechaInicio = lic?.fecha_inicio ?? lic?.inicio ?? null;
  const fechaFin = lic?.fecha_fin ?? lic?.fin ?? null;
  const fechaCreacion = lic?.fecha_creacion ?? lic?.creada_en ?? lic?.created_at ?? null;

  // Estudiante (puede venir anidado en distintas claves)
  const est =
    lic?.correo_usuario ??
    lic?.nombre ??
    lic?.estudiante ??
    lic?.usuarioSolicitante ??
    lic?.datos_estudiante ??
    root?.estudiante ??
    root?.usuario ??
    root?.alumno ??
    root?.perfil ??
    {};

  // PRIORIZAR: nombre y correo_usuario directamente del objeto licencia
  const nombre = 
    lic?.nombre ?? // Primero buscar nombre directamente en la licencia
    est?.nombre ?? // Luego en el objeto estudiante
    notEmpty([est?.nombres, est?.apellidos, est?.apellido_paterno, est?.apellido_materno]
      .filter(Boolean)
      .join(" ")) ?? 
    "—";
  
  const email = 
    lic?.correo_usuario ?? // Primero buscar correo_usuario directamente en la licencia
    est?.correoInstitucional ?? 
    est?.email ?? 
    est?.correo ?? 
    est?.correo_institucional ?? 
    "—";

  const rut =
    est?.rut ??
    (est?.rut_sin_dv && est?.dv ? `${est.rut_sin_dv}-${est.dv}` : undefined) ??
    est?.dni ??
    est?.run ??
    "—";

  // Si el BE sólo envió ids, guárdalos para fallback
  const estudianteId =
    lic?.id_usuario ??
    lic?.id_estudiante ??
    root?.id_usuario ??
    root?.id_estudiante ??
    est?.id_usuario ??
    est?.id ??
    null;

  const estudiante = {
    nombre,
    rut,
    email,
    idLicencia: id ?? "—", // requisito: mostrar ID aquí
  };

  // Archivo (último o único posible)
  const archBase =
    lic?.archivo ??
    root?.archivo ??
    (Array.isArray(root?.archivos) ? root.archivos[0] : null) ??
    (Array.isArray(lic?.archivos) ? lic.archivos[0] : null) ??
    null;

  const archivo = archBase
    ? {
        nombre: archBase?.nombre_archivo ?? archBase?.filename ?? archBase?.nombre ?? "archivo",
        mimetype: archBase?.mimetype ?? archBase?.mimeType ?? "",
        url: archBase?.ruta_url ?? archBase?.url ?? archBase?.descarga ?? null,
      }
    : null;

  return {
    estudiante,
    estudianteId, // <- para fallback
    licencia: {
      folio: folio ?? "—",
      estado: estado ?? "—",
      motivoRechazo: motivoRechazo ?? "",
      fechas: {
        inicio: fechaInicio ? fmtDate(fechaInicio) : "—",
        fin: fechaFin ? fmtDate(fechaFin) : "—",
        creada: fechaCreacion ? fmtDateTime(fechaCreacion) : "—",
      },
    },
    archivo,
  };
}

// ---------- Intentos de obtener estudiante si no vino completo ----------
async function tryFetchEstudiante(headers, estudianteId) {
  // Lista de endpoints candidatos en orden
  const candidates = [
    { url: `${API_BASE}/api/usuarios/me`, byId: false },
    { url: `${API_BASE}/api/perfil/me`, byId: false },
    estudianteId ? { url: `${API_BASE}/api/usuarios/${estudianteId}`, byId: true } : null,
    estudianteId ? { url: `${API_BASE}/api/perfiles/${estudianteId}`, byId: true } : null,
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      const res = await fetch(c.url, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) continue;

      const root = json?.data ?? json;
      const est = root?.usuario ?? root?.perfil ?? root;

      const joined = [est?.nombres, est?.apellidos, est?.apellido_paterno, est?.apellido_materno]
        .filter(Boolean)
        .join(" ");
      const nombre = (est?.nombre ?? notEmpty(joined)) ?? undefined;
      const rut =
        est?.rut ??
        (est?.rut_sin_dv && est?.dv ? `${est.rut_sin_dv}-${est.dv}` : undefined) ??
        est?.dni ??
        est?.run ??
        undefined;
      const email = est?.correoInstitucional ?? est?.correo_usuario?? est?.email ?? est?.correo ?? est?.correo_institucional ?? undefined;

      if (nombre || rut || email) {
        return {
          nombre: nombre ?? "—",
          rut: rut ?? "—",
          email: email ?? "—",
        };
      }
    } catch {
      // continua con el siguiente endpoint
    }
  }
  return null;
}

// ---------- Adjuntos ----------
function AttachmentView({ file }) {
  const [open, setOpen] = useState(false);

  if (!file?.url) {
    return <div className="text-sm text-gray-500">Sin archivo adjunto</div>;
  }

  const puedePDF = isPDF(file.mimetype || file.nombre);
  const puedeImg = isImage(file.mimetype || file.nombre);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex-1">
          <div className="font-medium text-sm break-all">{file.nombre}</div>
          <div className="text-xs text-gray-500">
            {puedePDF ? "Documento PDF" : puedeImg ? "Imagen" : "Archivo"}
          </div>
        </div>
      </div>

      {(puedePDF || puedeImg) ? (
        <div className="flex gap-2">
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Previsualizar
          </button>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            download={file.nombre}
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

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="relative bg-white w-11/12 md:w-4/5 h-5/6 rounded-lg overflow-hidden shadow-xl">
            {puedePDF ? (
              <iframe title={file.nombre} src={file.url} className="w-full h-full" />
            ) : (
              <img src={file.url} alt={file.nombre} className="w-full h-full object-contain" />
            )}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 bg-gray-800 text-white rounded-full w-9 h-9 grid place-items-center hover:bg-black"
              aria-label="Cerrar previsualización"
            >
              ✕
            </button>
            <a
              href={file.url}
              download={file.nombre}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
            >
              Descargar
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Página ----------
export default function DetalleLicencia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchDetalle() {
      try {
        setLoading(true);
        setErr("");

        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // Intento 1: /api/licencias/detalle/:id
        let res = await fetch(`${API_BASE}/api/licencias/detalle/${id}`, { headers });
        let json;

        // Si no existe ese endpoint, intento 2: /api/licencias/:id
        if (!res.ok) {
          res = await fetch(`${API_BASE}/api/licencias/${id}`, { headers });
        }
        json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.msg || json?.mensaje || json?.error || "No se pudo obtener el detalle.");
        }

        // 1) normalizamos
        const normalized = normalizeDetalle(json);

        // 2) fallback: si faltan datos de estudiante, intentamos pedirlos
        if (
          (!normalized.estudiante?.nombre || normalized.estudiante.nombre === "—") ||
          (!normalized.estudiante?.email || normalized.estudiante.email === "—") ||
          (!normalized.estudiante?.rut || normalized.estudiante.rut === "—")
        ) {
          const extra = await tryFetchEstudiante(headers, normalized.estudianteId);
          if (extra) {
            normalized.estudiante = {
              ...normalized.estudiante,
              ...extra,
            };
          }
        }

        if (mounted) setData(normalized);
      } catch (e) {
        if (mounted) setErr(e.message || "Error inesperado");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDetalle();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app">
        <Navbar />
        <main className="flex-1 grid place-items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-lg">Cargando licencia...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app">
        <Navbar />
        <main className="flex-1 grid place-items-center px-4">
          <div className="max-w-xl w-full bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">No se pudo cargar el detalle</h2>
            <p className="text-red-600 mb-4">{err}</p>
            <button
              onClick={() => navigate("/mis-licencias")}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              ← Volver a Licencias
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { estudiante, licencia, archivo } = data ?? {};

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-none">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">Detalle de Licencia</h1>
                {licencia?.folio && <p className="text-gray-500">Folio: {licencia.folio}</p>}
              </div>
              <button
                onClick={() => navigate("/mis-licencias")}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors self-start sm:self-auto"
              >
                ← Volver a Licencias
              </button>
            </div>

            {/* Datos del estudiante */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Datos del Estudiante</h2>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Nombre:</span>
                    <span className="text-gray-900">{estudiante?.nombre ?? "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="text-gray-900 break-all">{estudiante?.email ?? "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">ID de licencia:</span>
                    <span className="text-gray-900">{estudiante?.idLicencia ?? "—"}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Datos de la licencia */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Datos de la Licencia</h2>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Folio:</span>
                    <span className="text-gray-900">{licencia?.folio ?? "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Estado:</span>
                    <span className="text-gray-900 capitalize">{licencia?.estado ?? "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Fecha de envío:</span>
                    <span className="text-gray-900">{licencia?.fechas?.creada ?? "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Inicio de reposo:</span>
                    <span className="text-gray-900">{licencia?.fechas?.inicio ?? "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Fin de reposo:</span>
                    <span className="text-gray-900">{licencia?.fechas?.fin ?? "—"}</span>
                  </div>

                  {licencia?.motivoRechazo ? (
                    <div className="flex flex-col sm:col-span-2">
                      <span className="font-medium text-gray-600">Motivo de rechazo:</span>
                      <span className="text-gray-900">{licencia.motivoRechazo}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Archivo adjunto */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Archivo Adjunto</h2>
              <div className="border rounded-lg p-4">
                <AttachmentView file={archivo} />
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
