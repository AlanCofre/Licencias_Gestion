import React, { useState } from "react";
import bannerLogin from "../assets/banner-login.png";
import { useNavigate } from "react-router-dom";

function AppRegistro() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (contrasena !== confirmar) {
      setMensaje("Las contraseñas no coinciden");
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
        setMensaje(data.error || "Error al registrar usuario");
      }
    } catch (error) {
      setMensaje("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-start py-12">
      {/* Fondo */}
      <img
        src={bannerLogin}
        alt="Fondo"
        className="fixed inset-0 w-full h-full object-cover z-0"
      />

      {/* Título principal */}
      <h1 className="relative z-10 text-white text-center text-[clamp(2rem,8vw,8rem)] drop-shadow-[0_8px_9px_rgba(0,0,0,0.5)] mb-12 font-display font-extrabold">
        MedManager
      </h1>

      {/* Contenedor de login/registro */}
      <div className="relative z-10 w-[90%] max-w-[50.25rem] bg-white rounded-lg shadow-md py-10 flex flex-col items-center justify-center border-white border-30">
        <h2 className="text-3xl font-semibold text-black text-center">
          Registro
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col w-full px-10 gap-4">
          <div>
            <label className="block text-black font-normal mb-2">
              Nombre y Apellido:
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre y apellido"
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">
              Correo Electrónico:
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingresa tu correo electrónico"
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">
              Contraseña:
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Ingresa tu contraseña"
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">
              Confirmar Contraseña:
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Ingresa tu contraseña otra vez"
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
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        </div>
        {/* Enlace al login */}
        <div className="relative z-10 mt-10 text-center text-black text-base">
          <span>¿Ya tienes una cuenta? </span>
          <span
            className="text-[#76F1FF] font-bold cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Inicia sesión aquí.
          </span>
      </div>
    </div>
  );
}

export default AppRegistro;
