import React, { useState } from "react";
import bannerLogin from "../assets/banner-login.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppLogin() {
  const { login } = useAuth();
  const navigate = useNavigate(); // hook para navegar
  const [roleSelect, setRoleSelect] = useState("alumno");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simular autenticación - reemplazar por llamada real a API
    setTimeout(() => {
      const userData = { name: "Juan Pérez", role: roleSelect };
      login(userData);
      setLoading(false);
      navigate("/", { replace: true });
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
          Inicio de sesión
        </h2>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* campos reales: correo/contraseña aquí */}
          <div>
            <label className="block text-black font-normal mb-2">
              Tipo de cuenta (solo pruebas)
            </label>
            <select
              value={roleSelect}
              onChange={(e) => setRoleSelect(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            >
              <option value="alumno">Alumno</option>
              <option value="secretaria">Secretaria</option>
            </select>
          </div>

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
