import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircleIcon, BellIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileBellOpen, setMobileBellOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("pendientes");
  const dropdownRef = useRef(null);
  const mobileBellRef = useRef(null);

  // Estado de notificaciones con fechas (como objetos Date)
  const [notifications, setNotifications] = useState({
    pendientes: [
      {
        id: 1,
        text: 'La licencia "Resfrío con gripe" se encuentra pendiente de revisión',
        read: false,
        date: new Date("2025-09-25T14:30:00"),
      },
    ],
    revisadas: [
      {
        id: 2,
        text: 'La licencia de "Alergias" está siendo revisada',
        read: false,
        date: new Date("2025-09-24T10:15:00"),
      },
    ],
    verificadas: [
      {
        id: 3,
        text: 'La licencia "Covid" ha sido verificada y aceptada',
        read: false,
        date: new Date("2025-09-23T18:45:00"),
      },
      {
        id: 4,
        text: 'La licencia "Infección estomacal" ha sido verificada y rechazada',
        read: false,
        date: new Date("2025-09-27T09:20:00"),
      },
    ],
  });

  // Marcar como leído
  const markAsRead = (category, id) => {
    setNotifications((prev) => ({
      ...prev,
      [category]: prev[category].map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const role = String(user?.role || "").toLowerCase();
  const displayName = user
    ? role === "secretaria" || role === "secretary"
      ? "Sec. Juana Perez"
      : user.name || user.role
    : "Invitado";

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
      if (
        mobileBellRef.current &&
        !mobileBellRef.current.contains(event.target)
      ) {
        setMobileBellOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Función para formatear texto con colores según estado
  const formatText = (text) => {
    if (text.toLowerCase().includes("rechazada")) {
      return <span className="text-red-600 font-medium">{text}</span>;
    }
    if (text.toLowerCase().includes("verificada")) {
      return <span className="text-green-600 font-medium">{text}</span>;
    }
    return text;
  };

  return (
    <header className="bg-[#048FD4] text-white shadow-md relative" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#048FD4] rounded-sm p-1"
              aria-label="MedManager - Ir al inicio"
              onClick={closeMenu}
            >
              <span className="text-2xl font-bold tracking-wide font-display">
                MedManager
              </span>
            </Link>
          </div>

          {/* Navigation desktop */}
          <nav
            className="hidden md:flex flex-1 justify-center relative"
            role="navigation"
            aria-label="Navegación principal"
          >
            <ul className="flex gap-8 text-sm font-medium items-center">
              <li>
                <Link
                  to={role === "secretaria" ? "/secretaria" : "/alumno"}
                  className="px-3 py-2 hover:bg-white/10 rounded transition-colors"
                >
                  Inicio
                </Link>
              </li>

              {/* Solo mostrar para secretaria */}
              {(role === "secretaria" || role === "secretary") && (
                <li>
                  <Link
                    to="/licencias-por-revisar"
                    className="px-3 py-2 hover:bg-white/10 rounded transition-colors"
                  >
                    Licencias por Revisar
                  </Link>
                </li>
              )}

              {/* Botones con notificaciones en desktop */}
              {["pendientes", "revisadas", "verificadas"].map((category) => (
                <li key={category} className="relative" ref={dropdownRef}>
                  <button
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === category ? null : category
                      )
                    }
                    className="px-3 py-2 hover:bg-white/10 rounded transition-colors relative"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    {notifications[category].filter((n) => !n.read).length >
                      0 && (
                      <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                        {
                          notifications[category].filter((n) => !n.read)
                            .length
                        }
                      </span>
                    )}
                  </button>

                  {openDropdown === category && (
                    <div className="absolute top-full mt-3 w-80 bg-white text-black shadow-xl rounded-lg z-50">
                      <div className="absolute -top-2 left-6 w-4 h-4 bg-white rotate-45 shadow-md rounded-sm"></div>
                      <ul className="relative z-10">
                        {[...notifications[category]]
                          .sort(
                            (a, b) => new Date(b.date) - new Date(a.date)
                          )
                          .map((n) => (
                            <li
                              key={n.id}
                              className={`px-4 py-3 text-sm border-b last:border-none flex flex-col gap-1 ${
                                n.read
                                  ? "bg-gray-100 text-gray-500"
                                  : "bg-white"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span>{formatText(n.text)}</span>
                                {!n.read && (
                                  <button
                                    onClick={() =>
                                      markAsRead(category, n.id)
                                    }
                                    className="ml-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 px-2 py-1 rounded transition"
                                  >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Leer
                                  </button>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">
                                {n.date.toLocaleString("es-CL")}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* User info + mobile actions */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs opacity-90">Usuario</div>
              <Link
                to="/edit-profile"
                className="font-semibold text-sm hover:underline hover:text-gray-200 transition-colors"
              >
                {displayName}
              </Link>
            </div>

            <Link
              to="/login"
              className="hidden md:inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors text-sm font-medium"
            >
              Iniciar sesión
            </Link>

            {/* Campana de notificaciones en móvil */}
            <div className="relative md:hidden" ref={mobileBellRef}>
              <button
                onClick={() => setMobileBellOpen(!mobileBellOpen)}
                className="p-2 rounded-md hover:bg-white/10 transition-colors relative"
                aria-label="Notificaciones"
              >
                <BellIcon className="w-6 h-6" />
                {Object.values(notifications)
                  .flat()
                  .filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {
                      Object.values(notifications)
                        .flat()
                        .filter((n) => !n.read).length
                    }
                  </span>
                )}
              </button>

              {mobileBellOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-black shadow-xl rounded-lg z-50">
                  {/* Tabs */}
                  <div className="flex border-b">
                    {["pendientes", "revisadas", "verificadas"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setMobileTab(cat)}
                        className={`flex-1 px-3 py-2 text-sm font-medium ${
                          mobileTab === cat
                            ? "bg-gray-100 border-b-2 border-[#048FD4]"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Notificaciones */}
                  <ul className="max-h-60 overflow-y-auto">
                    {[...notifications[mobileTab]]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((n) => (
                        <li
                          key={n.id}
                          className={`px-4 py-3 text-sm border-b last:border-none flex flex-col gap-1 ${
                            n.read
                              ? "bg-gray-100 text-gray-500"
                              : "bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{formatText(n.text)}</span>
                            {!n.read && (
                              <button
                                onClick={() => markAsRead(mobileTab, n.id)}
                                className="ml-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 px-2 py-1 rounded transition"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                                Leer
                              </button>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {n.date.toLocaleString("es-CL")}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Botón menú hamburguesa */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <nav
          id="mobile-menu"
          className={`md:hidden transition-all duration-200 ease-in-out overflow-hidden ${
            isOpen ? "max-h-96 pb-4" : "max-h-0"
          }`}
          aria-label="Navegación móvil"
          role="navigation"
        >
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <Link
                to={role === "secretaria" ? "/secretaria" : "/alumno"}
                className="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors"
                onClick={closeMenu}
              >
                Inicio
              </Link>
            </li>

            {/* Solo para secretaria en móvil también */}
            {(role === "secretaria" || role === "secretary") && (
              <li>
                <Link
                  to="/licencias-por-revisar"
                  className="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors"
                  onClick={closeMenu}
                >
                  Licencias por Revisar
                </Link>
              </li>
            )}

            <li className="border-t border-white/20 mt-2 pt-2">
              <Link
                to="/login"
                className="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors font-medium"
                onClick={closeMenu}
              >
                Iniciar sesión
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
