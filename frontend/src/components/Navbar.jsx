// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth?.() ?? {};
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileBellOpen, setMobileBellOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("pendientes");
  const [expanded, setExpanded] = useState({});

  const role = String(user?.role || "").toLowerCase();
  const isSecretary = role === "secretaria" || role === "secretary";
  const displayName = user
    ? isSecretary
      ? "Sec. Juana Perez"
      : user.name || user.role
    : "Invitado";

  const [notifications, setNotifications] = useState({
    pendientes: [
      {
        id: 1,
        text: 'Nueva licencia subida por Juan Pérez',
        description: "Se subió una licencia médica nueva desde la plataforma. Revisar documentos y confirmar recepción.",
        read: false,
        date: new Date("2025-09-26T09:10:00"),
      },
      {
        id: 2,
        text: 'Licencia de María González pendiente',
        description: "Licencia médica enviada por María González requiere revisión. Verificar validez de documentos adjuntos.",
        read: false,
        date: new Date("2025-09-27T11:45:00"),
      },
    ],
    revisadas: [
      {
        id: 3,
        text: 'Licencia de alergias en revisión',
        description: "Tu solicitud de licencia está en proceso de evaluación.",
        read: false,
        date: new Date("2025-09-24T10:15:00"),
      },
    ],
    verificadas: [
      {
        id: 4,
        text: 'Licencia Covid aceptada',
        description: "Licencia revisada y aceptada. Tu ausencia queda registrada.",
        read: false,
        date: new Date("2025-09-23T18:45:00"),
        status: "verificada",
      },
      {
        id: 5,
        text: 'Licencia infección estomacal rechazada',
        description: "Revisada, pero rechazada debido a inconsistencias en el documento médico.",
        read: false,
        date: new Date("2025-09-22T09:20:00"),
        status: "rechazada",
      },
    ],
  });

  const markAsRead = (category, id) => {
    setNotifications((prev) => ({
      ...prev,
      [category]: prev[category].map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
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

  const formatText = (text) => {
    if (text.toLowerCase().includes("rechazada")) return <span className="text-red-600 font-medium">{text}</span>;
    if (text.toLowerCase().includes("aceptada") || text.toLowerCase().includes("verificada")) return <span className="text-green-600 font-medium">{text}</span>;
    return text;
  };

  const CheckIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.1 7.1a1 1 0 01-1.4 0L3.3 8.9a1 1 0 011.4-1.4l3.1 3.1 6.4-6.4a1 1 0 011.5 0z" clipRule="evenodd" />
    </svg>
  );

  const BellSvg = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3.6c0 .538-.214 1.055-.595 1.395L4 17h11z" />
    </svg>
  );

  const ChevronDownSvg = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4" />
    </svg>
  );
  const ChevronUpSvg = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 12l4-4 4 4" />
    </svg>
  );

  const renderNotification = (n, category) => (
    <li
      key={n.id}
      className={`px-4 py-3 text-sm border-b last:border-none flex flex-col gap-1 transition-colors ${
        n.read ? "bg-gray-100 text-gray-500" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <span>{formatText(n.text)}</span>
          <div className="text-xs text-gray-400 mt-1">{n.date.toLocaleString("es-CL")}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={() => toggleDescription(n.id)} className="text-gray-500 hover:text-gray-700 transition p-1">
            {expanded[n.id] ? <ChevronUpSvg /> : <ChevronDownSvg />}
          </button>
          {!n.read && (
            <button onClick={() => markAsRead(category, n.id)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 px-2 py-1 rounded transition">
              <CheckIcon /> Leer
            </button>
          )}
        </div>
      </div>
      {expanded[n.id] && (
        <div className="mt-2 bg-gray-50 text-gray-700 p-2 rounded-md shadow-inner border border-gray-200 text-sm transition-all">
          {n.description}
        </div>
      )}
    </li>
  );

  const NotificationDropdown = ({ category }) => {
    const unread = notifications[category]?.filter((n) => !n.read).length ?? 0;
    return (
      <li className="relative" data-notif-dropdown>
        <button
          onClick={() => setOpenDropdown((cur) => (cur === category ? null : category))}
          className="px-3 py-2 hover:bg-white/10 rounded transition-colors relative"
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
          {unread > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
              {unread}
            </span>
          )}
        </button>
        {openDropdown === category && (
          <div className="absolute top-full mt-3 w-80 bg-white text-black shadow-xl rounded-lg z-50">
            <div className="absolute -top-2 left-6 w-4 h-4 bg-white rotate-45 shadow-md rounded-sm" />
            <ul className="relative z-10">
              {[...(notifications[category] || [])]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((n) => renderNotification(n, category))}
            </ul>
          </div>
        )}
      </li>
    );
  };

  const SecretaryBell = () => {
    const unread = (notifications.pendientes || []).filter((n) => !n.read).length;
    return (
      <div className="relative hidden md:block" data-notif-dropdown>
        <button
          onClick={() => setOpenDropdown((cur) => (cur === "pendientes-secretaria" ? null : "pendientes-secretaria"))}
          className="p-2 rounded-md hover:bg-white/10 transition-colors relative"
        >
          <BellSvg />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">{unread}</span>
          )}
        </button>
        {openDropdown === "pendientes-secretaria" && (
          <div className="absolute right-0 mt-3 w-80 bg-white text-black shadow-xl rounded-lg z-50">
            <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 shadow-md rounded-sm" />
            <ul className="relative z-10">
              {[...(notifications.pendientes || [])]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((n) => renderNotification(n, "pendientes"))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const mobileTabs = isSecretary ? ["pendientes"] : ["pendientes", "revisadas", "verificadas"];

  return (
    <header className="bg-[#048FD4] text-white shadow-md relative" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" onClick={closeMenu} className="flex items-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#048FD4] rounded-sm p-1">
              <span className="text-2xl font-bold tracking-wide font-display">MedManager</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex flex-1 justify-center" role="navigation" aria-label="Navegación principal">
            <ul className="flex gap-8 text-sm font-medium items-center">
              <li>
                <Link to={role === "secretaria" ? "/secretaria" : "/alumno"} className="px-3 py-2 hover:bg-white/10 rounded transition-colors">Inicio</Link>
              </li>
              {!isSecretary &&
                ["pendientes", "revisadas", "verificadas"].map((cat) => (
                  <NotificationDropdown key={cat} category={cat} />
                ))}
            </ul>
          </nav>

          {/* Right area */}
          <div className="flex items-center gap-4">
            {/* Secretaria bell left of name */}
            {isSecretary && <SecretaryBell />}

            <div className="text-right hidden sm:block">
              <div className="text-xs opacity-90">Usuario</div>
              <Link to="/edit-profile" className="font-semibold text-sm hover:underline hover:text-gray-200 transition-colors">{displayName}</Link>
            </div>

            <Link to="/login" className="hidden md:inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors text-sm font-medium">
              Iniciar sesión
            </Link>

            {/* Mobile bell */}
            <div className="relative md:hidden" data-mobile-bell>
              <button onClick={() => setMobileBellOpen((v) => !v)} className="p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Notificaciones">
                <BellSvg />
                {Object.values(notifications).flat().filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {Object.values(notifications).flat().filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              {mobileBellOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-black shadow-xl rounded-lg z-50">
                  <div className="flex border-b">
                    {mobileTabs.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setMobileTab(cat)}
                        className={`flex-1 px-3 py-2 text-sm font-medium ${mobileTab === cat ? "bg-gray-100 border-b-2 border-[#048FD4]" : "hover:bg-gray-50"}`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                  <ul className="max-h-60 overflow-y-auto">
                    {[...(notifications[mobileTab] || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).map((n) => renderNotification(n, mobileTab))}
                  </ul>
                </div>
              )}
            </div>

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

        {/* Mobile menu */}
        <nav id="mobile-menu" className={`md:hidden transition-all duration-200 ease-in-out overflow-hidden ${isOpen ? "max-h-96 pb-4" : "max-h-0"}`} aria-label="Navegación móvil">
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <Link to={role === "secretaria" ? "/secretaria" : "/alumno"} className="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors" onClick={closeMenu}>Inicio</Link>
            </li>
            <li className="border-t border-white/20 mt-2 pt-2">
              <Link to="/login" className="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors font-medium" onClick={closeMenu}>Iniciar sesión</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
