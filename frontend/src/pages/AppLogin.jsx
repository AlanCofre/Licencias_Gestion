import React, { useState } from "react";
import bannerLogin from "../assets/banner-login.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [roleSelect, setRoleSelect] = useState("alumno");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        navigate("/alumno", { replace: true });
      }
    }, 700);
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
          Selecciona tu tipo de usuario
        </h2>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          <div>
            <label className="block text-black font-medium mb-4 text-lg">
              ¿Cómo deseas acceder?
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="role"
                  value="alumno"
                  checked={roleSelect === "alumno"}
                  onChange={(e) => setRoleSelect(e.target.value)}
                  className="mr-3 w-4 h-4 text-blue-600"
                  disabled={loading}
                />
                <div>
                  <div className="font-semibold text-gray-900">Alumno</div>
                  <div className="text-sm text-gray-600">
                    Generar y consultar mis licencias médicas
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="role"
                  value="secretaria"
                  checked={roleSelect === "secretaria"}
                  onChange={(e) => setRoleSelect(e.target.value)}
                  className="mr-3 w-4 h-4 text-blue-600"
                  disabled={loading}
                />
                <div>
                  <div className="font-semibold text-gray-900">Secretaria</div>
                  <div className="text-sm text-gray-600">
                    Revisar y gestionar licencias de estudiantes
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-14 bg-[#00AAFF] text-white text-xl font-semibold rounded-md shadow-md hover:brightness-110 transition self-center mt-4 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Accediendo..." : "Ingresar al Sistema"}
          </button>
        </form>

  
        <div className="mt-4 p-4 bg-blue-50 rounded border text-sm text-center">
          <p className="text-gray-700">
            Sistema de demostración - Selecciona un rol para acceder
          </p>
        </div>
      </div>

  
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