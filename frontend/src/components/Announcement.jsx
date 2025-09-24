import React from "react";
import anuncioImg from "../assets/banner-generar.png";

const Announcement = () => (
  <div className="container mx-auto px-8 py-16">
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2 p-12 lg:p-16">
          <h2 className="text-3xl lg:text-4xl font-sans font-bold text-gray-800 mb-6 leading-tight">
            La nueva manera de verificar
            <br />
            tus licencias medicas.
          </h2>
          <div className="space-y-6 text-gray-600 leading-relaxed text-lg font-sans">
            <p>
              Ahora puedes verificar el estado de tus licencias medicas;
              <br />
              Gracias a esto, puedes saber si tus licencias fueron validadas,
              <br />
              rechazadas o si aun están en proceso de revisión.
            </p>
            <p className="text-base text-gray-500">
              Para más información, solo basta con darle click a este anuncio.
            </p>
          </div>
        </div>
        <figure className="lg:w-96 lg:col-span-1">
          <div className="w-full h-full bg-gradient-to-r from-white/50 to-[var(--blue-50)]">
            <img
              src={anuncioImg}
              alt="Verificación"
              className="w-full h-full object-cover min-h-[220px]"
            />
          </div>
        </figure>
      </div>
    </div>
  </div>
);

export default Announcement;