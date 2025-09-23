import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import icono from "../assets/IconoCalendario.png";

const NavbarC = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selected, setSelected] = useState();

  return (
    <>
      {/* Navbar */}
      <header className="bg-gradient-to-b from-[var(--blue-600)] to-[var(--blue-700)] text-white shadow-sm relative z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo a la izquierda */}
            <div className="flex items-center">
              <h1 className="text-2xl font-display font-bold tracking-wide">MedManager</h1>
            </div>

            {/* Navegación centrada */}
            <div className="flex-1 flex justify-center">
              <div className="flex space-x-8 text-sm font-medium font-sans">
                <a href="#" className="hover:underline border-r border-blue-600 pr-4">Inicio</a>
                <a href="#" className="hover:underline border-r border-blue-600 pr-4">Pendientes</a>
                <a href="#" className="hover:underline border-r border-blue-600 pr-4">Revisadas</a>
                <a href="#" className="hover:underline">Verificadas</a>
              </div>
            </div>

            {/* Usuario a la derecha */}
            <div className="flex items-center space-x-4 text-sm font-sans">
              {/* Nombre del usuario */}
              <div className="text-right">
                <div className="text-xs opacity-75">Usuario</div>
                <div className="font-semibold">Juan Pérez</div>
              </div>

              {/* Botón de calendario con imagen */}
              <button
                onClick={() => setShowCalendar(true)}
                className="p-2 rounded hover:bg-blue-600 transition-colors"
              >
                <img src={icono} alt="Calendario" className="w-6 h-6" />
              </button>

              {/* Botón de logout */}
              <button className="bg-blue-700 hover:bg-blue-600 p-2 rounded transition-colors">
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

      {/* Overlay del calendario */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 relative">
            {/* Botón de cerrar */}
            <button
              onClick={() => setShowCalendar(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
            >
              ✕
            </button>

            {/* Calendario */}
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={setSelected}
            />
            {selected && (
              <p className="mt-2 text-sm text-gray-600">
                Seleccionaste: {selected.toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarC;
