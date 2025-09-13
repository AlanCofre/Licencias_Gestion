import React from "react";
import anuncioImg from "../assets/banner-generar.png";

const Announcement = () => (
  <section className="flex flex-col md:flex-row bg-white rounded shadow-lg mt-12 mx-4 md:mx-auto max-w-4xl overflow-hidden">
    <div className="flex-1 p-8">
      <h2 className="text-2xl font-bold mb-2">La nueva manera de verificar tus licencias medicas.</h2>
      <p className="text-gray-700 mb-2">
        Ahora puedes verificar el estado de tus licencias medicas;
        <br />
        Gracias a esto, puedes saber si tus licencias fueron validadas, rechazadas o si aun están en proceso de revisión.
      </p>
      <p className="text-gray-500 text-sm">
        Para más información, solo basta con darle click a este anuncio.
      </p>
    </div>
    <img
      src={anuncioImg}
      alt="Verificación"
      className="w-full md:w-1/3 object-cover"
    />
  </section>
);

export default Announcement;