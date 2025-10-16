// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth?.() ?? {};
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileBellOpen, setMobileBellOpen] = useState(false);
  const [expanded, setExpanded] = useState({});

  const role = String(user?.role || "").toLowerCase();
  const isSecretary = role === "secretaria" || role === "secretary";
  const displayName = user
    ? isSecretary
      ? "Sec. Juana Perez"
      : user.name || user.role
    : "Invitado";

  // Notificaciones combinadas (todas en un solo arreglo)
  const [allNotifications, setAllNotifications] = useState([
    {
      id: 1,
      text: "Nueva licencia subida por Juan Pérez",
      description: "Licencia médica nueva. Revisar documentos y confirmar recepción.",
      type: "pendiente",
      read: false,
      date: new Date("2025-09-26T09:10:00"),
    },
    {
      id: 2,
      text: "Licencia de María González pendiente",
      description: "Licencia médica requiere revisión.",
      type: "pendiente",
      read: false,
      date: new Date("2025-09-27T11:45:00"),
    },
    {
      id: 3,
      text: "Licencia de alergias en revisión",
      description: "Tu solicitud de licencia está en proceso de evaluación.",
      type: "revision",
      read: false,
      date: new Date("2025-09-24T10:15:00"),
    },
    {
      id: 4,
      text: "Licencia Covid aceptada",
      description: "Licencia revisada y aceptada. Tu ausencia queda registrada.",
      type: "verificada",
      read: false,
      date: new Date("2025-09-23T18:45:00"),
    },
    {
      id: 5,
      text: "Mantenimiento del sistema programado",
      description: "Habrá mantenimiento en el servidor mañana a las 22:00 hrs. El sistema no estará disponible durante una hora.",
      type: "soporte",
      read: false,
      date: new Date("2025-09-28T12:00:00"),
    },
  ]);

  const markAsRead = (id) => {
    setAllNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const toggleDescription = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMenu = () => setIsOpen((v) => !v);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inNotifDropdown = !!e.target.closest("[data-notif-dropdown]");
      const inMobileBell = !!e.target.closest("[data-mobile-bell]");
      if (!inNotifDropdown) setOpenDropdown(null);
      if (!inMobileBell) setMobileBellOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //  Icono según tipo
  const TypeIcon = ({ type }) => {
    const base = "w-5 h-5";
    switch (type) {
      case "pendiente":
        return <span className={`${base} text-blue-600`}>🕓</span>;
      case "revision":
        return <span className={`${base} text-yellow-600`}>🔍</span>;
      case "verificada":
        return <span className={`${base} text-green-600`}>✅</span>;
      case "soporte":
        return <span className={`${base} text-gray-600`}>🛠️</span>;
      default:
        return null;
    }
  };

const BellSvg = ({ className = "w-6 h-6 text-white" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 24c1.104 0 2-.895 2-2h-4c0 1.105.896 2 2 2zm6.364-6v-5c0-3.07-1.635-5.64-4.364-6.32V6a2 2 0 10-4 0v.68C7.271 7.36 5.636 9.93 5.636 13v5l-1.636 1.636V21h16v-1.364L18.364 18zM18 19H6v-1h12v1z" />
  </svg>
);


  const CheckIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.1 7.1a1 1 0 01-1.4 0L3.3 8.9a1 1 0 011.4-1.4l3.1 3.1 6.4-6.4a1 1 0 011.5 0z" clipRule="evenodd" />
    </svg>
  );

// 🔔 Dropdown unificado (filtrado por rol)
const UnifiedBell = () => {
  // Filtrado según rol
  const filteredNotifications = allNotifications.filter((n) => {
  if (n.type === "soporte") return true; // todos ven soporte
  if (isSecretary) return n.type === "pendiente"; // secretaria solo pendientes
  if (!isSecretary) return n.type === "revision" || n.type === "verificada"; // estudiante solo revision y verificadas
  return false;
});

  const unread = filteredNotifications.filter((n) => !n.read).length;

  return (
    <div className="relative" data-notif-dropdown>
      <button
        onClick={() =>
          setOpenDropdown((cur) => (cur === "unified" ? null : "unified"))
        }
        className="p-2 rounded-md hover:bg-white/10 transition-colors relative"
      >
        <BellSvg />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
            {unread}
          </span>
        )}
      </button>

      {openDropdown === "unified" && (
        <div className="absolute right-0 mt-3 w-80 bg-white text-black shadow-xl rounded-lg z-50 max-h-80 overflow-y-auto">
          <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 shadow-md rounded-sm" />
          {filteredNotifications.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No hay notificaciones disponibles.
            </div>
          ) : (
            <ul className="relative z-10">
              {[...filteredNotifications]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 text-sm border-b last:border-none flex flex-col gap-1 ${
                      n.read ? "bg-gray-100 text-gray-500" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <TypeIcon type={n.type} />
                        <div>
                          <span className="font-medium">{n.text}</span>
                          <div className="text-xs text-gray-400 mt-1">
                            {n.date.toLocaleString("es-CL")}
                          </div>
                          <div className="text-xs text-gray-500 italic">
                            {n.type.charAt(0).toUpperCase() + n.type.slice(1)}
                          </div>
                        </div>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 px-2 py-1 rounded transition"
                        >
                          <CheckIcon /> Leer
                        </button>
                      )}
                    </div>

                    {expanded[n.id] && (
                      <div className="mt-2 bg-gray-50 text-gray-700 p-2 rounded-md shadow-inner border border-gray-200 text-sm transition-all">
                        {n.description}
                      </div>
                    )}

                    {!expanded[n.id] && (
                      <button
                        onClick={() => toggleDescription(n.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                      >
                        Ver más
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};


  return (
    <header className="bg-[#048FD4] text-white shadow-md relative" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" onClick={closeMenu} className="flex items-center p-1">
              <span className="text-2xl font-bold tracking-wide font-display">MedManager</span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex flex-1 justify-center">
            <ul className="flex gap-8 text-sm font-medium items-center">
              <li>
                <Link
                  to={isSecretary ? "/secretaria" : "/alumno"}
                  className="px-3 py-2 hover:bg-white/10 rounded transition-colors"
                >
                  Inicio
                </Link>
              </li>
            </ul>
          </nav>

          {/* Área derecha */}
          <div className="flex items-center gap-4">
            {/* Campanita común */}
            <UnifiedBell />

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
              Cerrar sesión
            </Link>

            {/* Menú móvil */}
            <button onClick={toggleMenu} className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
