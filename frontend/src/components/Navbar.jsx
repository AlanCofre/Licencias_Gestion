import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate(); // hook para navegar

  return (
    <header className="bg-gradient-to-b from-[var(--blue-600)] to-[var(--blue-700)] text-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo a la izquierda */}
          <div className="flex items-center">
            <h1 className="text-2xl font-display font-bold tracking-wide cursor-pointer"
              onClick={() => navigate("/dashboard")}
            >
              MedManager
            </h1>
          </div>

          {/* Navegación centrada */}
          <div className="flex-1 flex justify-center">
            <div className="flex space-x-8 text-sm font-medium font-sans">
              <span
                className="hover:underline border-r border-blue-600 pr-4 cursor-pointer"
                onClick={() => navigate("/")}
              >
                Inicio
              </span>
              <span
                className="hover:underline border-r border-blue-600 pr-4 cursor-pointer"
                onClick={() => navigate("/")}
              >
                Pendientes
              </span>
              <span className="hover:underline border-r border-blue-600 pr-4 cursor-pointer">
                Revisadas
              </span>
              <span className="hover:underline cursor-pointer"
              onClick={() => navigate("/")}
              >Verificadas</span>
            </div>
          </div>

          {/* Usuario a la derecha */}
          <div className="flex items-center space-x-4 text-sm font-sans">
            <div className="text-right">
              <div className="text-xs opacity-75">Usuario</div>
              <div className="font-semibold">Juan Pérez</div>
            </div>
            <button
              className="bg-blue-700 hover:bg-blue-600 p-2 rounded transition-colors"
              onClick={() => navigate("/")} // ejemplo: cerrar sesión
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
