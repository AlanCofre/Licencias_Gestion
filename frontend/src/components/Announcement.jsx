import React from "react";
import { useAuth } from "../context/AuthContext";
import anuncioImg from "../assets/banner-generar.png";

const Announcement = () => {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const isSecretary = role === "secretaria" || role === "funcionario";

  // usar el nombre que venga del login; anteponer "Sec." si es secretaria
  const rawName = String(user?.name || "").trim();
  const cleanName = rawName.replace(/^Sec\.?\s*/i, ""); // evitar doble prefijo
  const displayName = isSecretary
    ? cleanName ? `Sec. ${cleanName}` : "Sec. Usuario"
    : rawName || "Usuario";

  return (
    <div className="container mx-auto px-8 py-20">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch">
          <div className="lg:col-span-2 p-16 lg:p-20">
            {isSecretary ? (
              <>
                <h2 className="text-4xl lg:text-5xl font-sans font-bold text-gray-800 mb-6 leading-tight">
                  Bienvenida, {displayName}
                </h2>
                <div className="space-y-6 text-gray-600 leading-relaxed text-xl lg:text-lg font-sans">
                  <p>
                    Este es tu panel de trabajo. Desde aquí puedes revisar las licencias pendientes,
                    generar revisiones cuando falte documentación y consultar el historial de acciones.
                  </p>
                  <p className="text-base text-gray-500 max-w-xl">
                    Accede rápidamente a "Pendientes" para atender nuevos casos o a "Historial" para
                    revisar gestiones anteriores. Usa "Generar Revisión" para solicitar información adicional.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-4xl lg:text-5xl font-sans font-bold text-gray-800 mb-6 leading-tight">
                  La nueva manera de verificar
                  <br />
                  tus licencias medicas.
                </h2>
                <div className="space-y-6 text-gray-600 leading-relaxed text-xl lg:text-lg font-sans">
                  <p>
                    Ahora puedes verificar el estado de tus licencias medicas;
                    <br />
                    Gracias a esto, puedes saber si tus licencias fueron validadas,
                    <br />
                    rechazadas o si aun están en proceso de revisión.
                  </p>
                  <p className="text-base text-gray-500 max-w-xl">
                    Para más información, solo basta con darle click a este anuncio.
                  </p>
                </div>
              </>
            )}
          </div>

          <figure className="lg:w-96 lg:col-span-1">
            <div className="w-full h-full bg-gradient-to-r from-white/50 to-[var(--blue-50)] flex items-center">
              <img
                src={anuncioImg}
                alt="Verificación"
                className="w-full h-full object-cover min-h-[320px] lg:min-h-[380px]"
              />
            </div>
          </figure>
        </div>
      </div>
    </div>
  );
};

export default Announcement;