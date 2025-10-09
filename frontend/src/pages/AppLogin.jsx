import React, { useState } from "react";
import bannerLogin from "../assets/banner-login.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppLogin() {
  const { login } = useAuth();
  const navigate = useNavigate(); // hook para navegar

  // estado para inputs y UI
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${base}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo_usuario: correo, contrasena }),
      });
      const data = await res.json();

      if (!res.ok || !data?.token || !data?.usuario) {
        throw new Error(data?.error || "Credenciales inválidas");
      }

      // persistir sesión en localStorage (coherencia con services)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.usuario));

      // Avisar a AuthContext con el objeto correcto
      login(data.usuario);

      let rol = "";
      if (data.usuario?.id_rol && typeof data.usuario.id_rol === "object" && data.usuario.id_rol.nombre) {
        rol = String(data.usuario.id_rol.nombre).toLowerCase();
      } else if (typeof data.usuario?.id_rol === "string") {
        rol = data.usuario.id_rol.toLowerCase();
      } else if (typeof data.usuario?.rol === "string") {
        rol = data.usuario.rol.toLowerCase();
      }

      if (rol === "estudiante") {
        navigate("/alumno");
      } else if (rol === "profesor") {
        navigate("/profesor");
      } else if (rol === "funcionario") {
        navigate("/secretaria");
      } else {
        navigate("/"); // fallback
      }
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
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
      <h1 className="relative z-10 text-white text-center font-extrabold text-[clamp(2rem,8vw,8rem)] drop-shadow-[0_8px_9px_rgba(0,0,0,0.5)] mb-12 font-display">
        MedManager
      </h1>

      {/* Contenedor de login */}
      <div className="relative z-10 w-[90%] max-w-[50.25rem] bg-white rounded-lg shadow-md p-10 flex flex-col gap-6 border-white border-30">
        <h2 className="text-3xl font-semibold text-black text-center mb-6">
          Inicio de sesión
        </h2>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-black font-normal mb-2">
              Correo Electrónico:
            </label>
            <input
              type="email"
              placeholder="usuario@uct.cl"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">
              Contraseña:
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center -mt-2">{error}</p>
          )}

          {/* Enlace Olvidé mi contraseña */}
          <div className="flex justify-center mt-2">
            <span
              className="text-[#00AAFF] text-sm font-medium cursor-pointer hover:underline"
              onClick={() => navigate("/forgot-password")}
            >
              Olvidé mi contraseña.
            </span>
          </div>

          <button
            type="submit"
            className="w-full h-14 bg-[#00AAFF] text-white text-xl font-semibold rounded-md shadow-md hover:brightness-110 transition self-center mt-4 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>

      {/* Registro debajo del contenedor */}
      <div className="relative z-10 mt-10 text-center text-black text-base">
        <span>¿No tienes una cuenta? </span>
        <span
          className="text-[#76F1FF] font-bold cursor-pointer hover:underline"
          onClick={() => navigate("/registro")}
        >
          Regístrate aquí.
        </span>
      </div>
    </div>
  );
}

export default AppLogin;