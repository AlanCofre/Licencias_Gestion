import React, { useState } from "react";
import bannerLogin from "../assets/banner-login.png";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function AppRegistro() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (contrasena !== confirmar) {
      setMensaje(t("registro.errorNoMatch"));
      return;
    }

    try {
      setLoading(true);
      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

      const res = await fetch(`${base}/usuarios/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          correo_usuario: correo,
          contrasena,
          rol: "estudiante",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        navigate("/login");
      } else {
        setMensaje(data.error || t("registro.errorRegister"));
      }
    } catch (error) {
      setMensaje(t("registro.errorServer"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-start py-12">
      {/* Fondo */}
      <img
        src={bannerLogin}
        alt={t("registro.bannerAlt")}
        className="fixed inset-0 w-full h-full object-cover z-0"
      />

      {/* Título */}
      <h1 className="relative z-10 text-white text-center text-[clamp(2rem,8vw,8rem)] drop-shadow-[0_8px_9px_rgba(0,0,0,0.5)] mb-12 font-display font-extrabold">
        MedManager
      </h1>

      {/* Contenedor */}
      <div className="relative z-10 w-[90%] max-w-[50.25rem] bg-white rounded-lg shadow-md py-10 flex flex-col items-center justify-center border-white border-30">
        <h2 className="text-3xl font-semibold text-black text-center">
          {t("registro.title")}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col w-full px-10 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-black font-normal mb-2">
              {t("registro.nameLabel")}
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t("registro.namePlaceholder")}
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Correo */}
          <div>
            <label className="block text-black font-normal mb-2">
              {t("registro.emailLabel")}
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder={t("registro.emailPlaceholder")}
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-black font-normal mb-2">
              {t("registro.passLabel")}
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder={t("registro.passPlaceholder")}
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-black font-normal mb-2">
              {t("registro.confirmPassLabel")}
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder={t("registro.confirmPassPlaceholder")}
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {mensaje && <p className="text-red-600 text-center">{mensaje}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-3/5 h-14 bg-[#00AAFF] text-white text-xl font-semibold rounded-md shadow-md hover:brightness-110 transition self-center ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? t("registro.btnRegisterLoading") : t("registro.btnRegister")}
          </button>
        </form>
      </div>

      {/* Link al login */}
      <div className="relative z-10 mt-10 text-center text-black text-base">
        <span>{t("registro.linkQuestion")} </span>
        <span
          className="text-[#76F1FF] font-bold cursor-pointer hover:underline"
          onClick={() => navigate("/login")}
        >
          {t("registro.linkLogin")}
        </span>
      </div>
    </div>
  );
}

export default AppRegistro;
