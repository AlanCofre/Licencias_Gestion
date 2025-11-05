// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { getMiPerfil } from "../services/perfilService";
import logo from "../assets/logo.svg";

// helper: decodificar jwt sin libs
function decodeToken(token) {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (e) {
    console.warn("[Navbar] no pude decodificar token", e);
    return null;
  }
}

export default function Navbar() {
  const { user } = useAuth?.() ?? {};
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [perfil, setPerfil] = useState(null);

  // leer token actual
  const rawToken =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const tokenData = decodeToken(rawToken);

  // DEBUG (lo puedes quitar): ver qué trae realmente el token
  console.log("[Navbar] tokenData =", tokenData);
  console.log("[Navbar] user from context =", user);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMiPerfil();
        const data = res?.data?.perfil ?? res?.perfil ?? res?.data ?? null;
        setPerfil(data);
      } catch (e) {
        console.error("[Navbar] getMiPerfil()", e);
        setPerfil(null);
      }
    })();
  }, []);

  // rol (token primero, luego contexto)
  const role = String(
    tokenData?.rol || user?.role || user?.id_rol || ""
  ).toLowerCase();

  const isSecretary =
    role === "secretaria" || role === "secretary" || role === "funcionario";

  // ==== AQUÍ ES LA CLAVE ====
  // orden de prioridad para el nombre
  const nameFromToken = tokenData?.nombre;
  const nameFromUser =
    user?.nombre || user?.name || user?.fullName || user?.fullname;
  const nameFromProfile = perfil?.nombre || perfil?.name;

  const baseName =
    nameFromToken ||
    nameFromUser ||
    nameFromProfile ||
    user?.role || // último recurso: mostrar el rol
    null;

  const displayName = baseName
    ? isSecretary
      ? `${t("prefix.secretary")} ${baseName}`
      : baseName
    : t("user.defaultName");

  // iniciales para el círculo
  const initials = (nameFromToken || nameFromUser || "")
    ? (nameFromToken || nameFromUser || "")
        .split(" ")
        .map((n) => n[0] ?? "")
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  // notificaciones
  const [studentNotifications, setStudentNotifications] = useState([]);
  const [secretaryNotifications, setSecretaryNotifications] = useState([]);

  const toggleDescription = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMenu = () => setIsOpen((v) => !v);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (isSecretary) {
      const fetchNotis = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
          }/api/notificaciones`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (data.ok) setSecretaryNotifications(data.data || []);
      };
      fetchNotis();
      const interval = setInterval(fetchNotis, 10000);
      return () => clearInterval(interval);
    }
  }, [isSecretary]);

  const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

  const mapStudentNotif = (r) => ({
    id: r.id_notificacion,
    text: r.asunto || "Notificación",
    type: "pendiente",
    date: new Date(r.fecha_envio),
    description: r.contenido ?? "",
    read: Boolean(r.leido),
  });

  useEffect(() => {
    if (!isSecretary && role !== "profesor") {
      const fetchStudentNotis = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API}/api/notificaciones`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.msg || json.error || "Error notifs");
          const arr = Array.isArray(json.data) ? json.data : [];
          setStudentNotifications(arr.map(mapStudentNotif));
        } catch (e) {
          console.error("[notifs alumno]", e);
        }
      };
      fetchStudentNotis();
      const id = setInterval(fetchStudentNotis, 10000);
      return () => clearInterval(id);
    }
  }, [isSecretary, role]);

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
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.1 7.1a1 1 0 01-1.4 0L3.3 8.9a1 1 0 011.4-1.4l3.1 3.1 6.4-6.4a1 1 0 011.5 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  const LogoutSvg = ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );

  const UnifiedBell = () => {
    let notifications = [];

    if (isSecretary) {
      notifications = secretaryNotifications;
    } else if (role === "profesor") {
      notifications = [];
    } else {
      notifications = studentNotifications;
    }

    const filteredNotifications = notifications;
    const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

    const unread = isSecretary
      ? notifications.filter((n) => !n.leido).length
      : filteredNotifications.filter((n) => !n.read).length;

    const markAsRead = async (id) => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/api/notificaciones/${id}/leida`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al marcar notificación como leída");

        if (isSecretary) {
          setSecretaryNotifications((prev) =>
            prev.map((n) =>
              n.id_notificacion === id ? { ...n, leido: 1 } : n
            )
          );
        } else if (role !== "profesor") {
          setStudentNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
        }
      } catch (err) {
        console.error("[markAsRead]", err);
      }
    };

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
                  .sort((a, b) => {
                    if (isSecretary) {
                      return new Date(b.fecha_envio) - new Date(a.fecha_envio);
                    }
                    return new Date(b.date) - new Date(a.date);
                  })
                  .map((n) =>
                    isSecretary ? (
                      <li
                        key={n.id_notificacion}
                        className={`px-4 py-3 text-sm border-b last:border-none flex flex-col gap-1 ${
                          n.leido ? "bg-gray-100 text-gray-500" : "bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>
                            {n.asunto}: {n.contenido}
                          </span>
                          {!n.leido && (
                            <button
                              onClick={() => markAsRead(n.id_notificacion)}
                              className="ml-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 px-2 py-1 rounded transition"
                            >
                              Marcar leída
                            </button>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(n.fecha_envio).toLocaleString("es-CL")}
                        </span>
                      </li>
                    ) : (
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
                                {n.date?.toLocaleString("es-CL")}
                              </div>
                              <div className="text-xs text-gray-500 italic">
                                {n.type?.charAt(0).toUpperCase() +
                                  n.type?.slice(1)}
                              </div>
                            </div>
                          </div>
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 px-2 py-1 rounded transition"
                            >
                              <CheckIcon /> {t("notifications.read")}
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
                            {t("notifications.viewMore")}
                          </button>
                        )}
                      </li>
                    )
                  )}
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
          <div className="flex items-center">
            <Link to="/" onClick={closeMenu} className="flex items-center p-1">
              <img src={logo} alt="MedManager" className="h-10 w-10 mr-3" />
              <span className="text-2xl font-bold tracking-wide font-display">
                MedManager
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex flex-1 justify-center">
            <ul className="flex gap-8 text-sm font-medium items-center">
              <li>
                <Link
                  to={isSecretary ? "/secretaria" : "/alumno"}
                  className="px-3 py-2 hover:bg-white/10 rounded transition-colors"
                >
                  {t("nav.home")}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <UnifiedBell />

            <div className="text-right hidden sm:block">
              <div className="text-xs opacity-90">{t("user.label")}</div>
              <Link
                to="/edit-profile"
                className="inline-flex items-center gap-3 max-w-[220px] font-semibold text-sm hover:underline hover:text-gray-200 transition-colors"
              >
                {perfil?.foto_url ? (
                  <img
                    src={perfil.foto_url}
                    alt={displayName}
                    onError={(e) =>
                      (e.currentTarget.src = "/img/avatar-placeholder.png")
                    }
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white">
                    {initials || "U"}
                  </div>
                )}

                <span className="truncate">{displayName}</span>
              </Link>
            </div>

            <Link
              to="/login"
              className="hidden md:inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-2 rounded transition-colors text-sm font-medium"
            >
              <LogoutSvg />
            </Link>

            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
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
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
