import React, { useState } from "react";
import { Search } from "lucide-react"; // librería de iconos (opcional)

function BarraBusqueda({ onBuscar, placeholder = "Buscar..." }) {
  const [termino, setTermino] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onBuscar) {
      onBuscar(termino.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center w-full max-w-md bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2"
    >
      <Search className="w-5 h-5 text-gray-400 mr-2" />
      <input
        type="text"
        value={termino}
        onChange={(e) => setTermino(e.target.value)}
        placeholder={placeholder}
        className="flex-1 outline-none text-gray-700 placeholder-gray-400"
      />
      <button
        type="submit"
        className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
      >
        Buscar
      </button>
    </form>
  );
}

export default BarraBusqueda;
