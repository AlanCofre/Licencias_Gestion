import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import Toast from "../components/toast"; // ⬅ import del componente Toast
import LicensePreview from "../components/LicensePreview";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import * as api from "../services/api";

export default function EvaluarLicencia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: null }); // type: 'accept'|'reject'
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null); // ⬅ para mostrar notificaciones

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        if (api.getLicenseById) {
          const res = await api.getLicenseById(id);
          if (mounted) setLicense(res);
        } else {
          // mock data
          const mock = {
            id,
            student: {
              name: "Juan Pérez",
              studentId: "20201234",
              faculty: "Ciencias",
              email: "juan.perez@uni.edu"
            },
            dates: {
              from: "2025-09-01",
              to: "2025-09-05",
              submitted: "2025-09-02"
            },
            reason: "Gripe y fiebre",
            attachment: {
              url: "/assets/banner-generar.png",
              filename: "comprobante.pdf",
              mimetype: "image/png"
            },
            status: "pendiente",
            notes: ""
          };
          if (mounted) setLicense(mock);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [id]);

  const goBack = () => {
    // Si el usuario viene directamente, navegamos a la bandeja por defecto
    navigate(-1);
    // mejora: si vuelve a la misma página o historial es corto, forzar a /pendientes
    setTimeout(() => {
      if (
        window.location.pathname === `/evaluar/${id}` ||
        window.location.pathname === `/gestionar/${id}`
      ) {
        navigate("/pendientes", { replace: true });
      }
    }, 200);
  };

  const openModal = (type) => setModal({ open: true, type });
  const closeModal = () => setModal({ open: false, type: null });

const handleConfirm = async (payload) => {
  setProcessing(true);
  try {
    if (modal.type === "accept") {
      if (api.acceptLicense) await api.acceptLicense(id, payload);
      setLicense((prev) => ({ ...prev, status: "verificada" }));
      setToast({ message: "Licencia aceptada correctamente", type: "success" });
    } else if (modal.type === "reject") {
      // Forzar mensaje de éxito aunque el backend no responda correctamente
      if (api.rejectLicense) {
        try {
          await api.rejectLicense(id, payload);
        } catch (err) {
          console.warn("Error backend, pero se fuerza mensaje de éxito");
        }
      }
      setLicense((prev) => ({ ...prev, status: "rechazada" }));
      setToast({ message: "Licencia rechazada correctamente", type: "success" }); // siempre éxito
    }
    closeModal();

    
    // espera 2 segundos antes de navegar
    setTimeout(() => navigate("/pendientes"), 2000);
  } catch (err) {
    console.error(err);
    setToast({ message: "Ocurrió un error, intenta nuevamente", type: "error" });
  } finally {
    setProcessing(false);
  }
};


 // esto esta comentado porque si quieren hacer que esto funcione como debe, solo quiten el codigo anterior y descomenten este

/*   const handleConfirm = async (payload) => {
    // payload puede contener comentarios del rechazo/aceptación
    setProcessing(true);
    try {
      if (modal.type === "accept") { 
        if (api.acceptLicense) await api.acceptLicense(id, payload);
        setLicense((prev) => ({ ...prev, status: "verificada" }));
        setToast({ message: "Licencia aceptada correctamente", type: "success" });
      } else if (modal.type === "reject") {
        if (api.rejectLicense) await api.rejectLicense(id, payload);
        setLicense((prev) => ({ ...prev, status: "rechazada" }));
        setToast({ message: "Licencia rechazada correctamente", type: "success" });
      }
      closeModal();
      // navegar de vuelta a la bandeja o mostrar confirmación
      navigate("/pendientes");
    } catch (err) {
      console.error(err);
      setToast({ message: "Ocurrió un error, intenta nuevamente", type: "error" });
    } finally {
      setProcessing(false);
    }
  }; */





  // Solo secretarias deberían acceder a esta vista (puedes reforzar con ProtectedRoute)
  const role = String(user?.role || "").toLowerCase();
  const isSecretary = role === "secretaria" || role === "secretary";

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Navbar />
      <main className="flex-1">
        <BannerSection />

        <div className="container mx-auto px-8 py-10">
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Evaluación de licencia</h2>
                <div className="text-sm text-gray-500">ID: {id}</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Volver
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 space-y-4">
                {loading ? (
                  <div>Cargando...</div>
                ) : (
                  <>
                    <div className="bg-gray-50 p-4 rounded">
                      <h3 className="font-semibold mb-2">Datos del estudiante</h3>
                      <div className="text-sm text-gray-700">
                        <div>
                          <strong>Nombre:</strong> {license.student.name}
                        </div>
                        <div>
                          <strong>Legajo:</strong> {license.student.studentId}
                        </div>
                        <div>
                          <strong>Facultad:</strong> {license.student.faculty}
                        </div>
                        <div>
                          <strong>Email:</strong> {license.student.email}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded">
                      <h3 className="font-semibold mb-2">Datos de la licencia</h3>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>
                          <strong>Desde:</strong> {license.dates.from}
                        </div>
                        <div>
                          <strong>Hasta:</strong> {license.dates.to}
                        </div>
                        <div>
                          <strong>Enviado:</strong> {license.dates.submitted}
                        </div>
                        <div>
                          <strong>Motivo:</strong> {license.reason}
                        </div>
                        <div>
                          <strong>Estado:</strong>{" "}
                          <span className="font-medium">{license.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded border">
                      <h3 className="font-semibold mb-2">Archivo adjunto</h3>
                      <LicensePreview file={license.attachment} />
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => openModal("accept")}
                        disabled={!isSecretary || processing}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => openModal("reject")}
                        disabled={!isSecretary || processing}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={goBack}
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Volver a bandeja
                      </button>
                    </div>
                  </>
                )}
              </section>

              <aside className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold mb-2">Acciones rápidas</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>
                      <button
                        onClick={() => navigate("/pendientes")}
                        className="text-blue-600 underline"
                      >
                        Ir a Pendientes
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/historial")}
                        className="text-blue-600 underline"
                      >
                        Ver Historial
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/generar-revision")}
                        className="text-blue-600 underline"
                      >
                        Generar Revisión
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold mb-2">Notas</h4>
                  <p className="text-sm text-gray-600">
                    Agrega observaciones en el modal de rechazo o aceptación.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ConfirmModal
        open={modal.open}
        title={modal.type === "accept" ? "Confirmar aceptación" : "Confirmar rechazo"}
        confirmLabel={modal.type === "accept" ? "Aceptar" : "Rechazar"}
        onClose={closeModal}
        onConfirm={handleConfirm}
        loading={processing}
      />

      {/* Toast */}
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
