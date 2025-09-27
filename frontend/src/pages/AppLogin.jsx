import React from "react";
import bannerLogin from "../assets/banner-login.png";
import { useNavigate } from "react-router-dom";

function AppLogin() {
  const navigate = useNavigate(); // hook para navegar

  return (
    <div className="max -h-screen bg-white flex flex-col items-center justify-start">
      {/* Fondo */}
      <img
        src={bannerLogin}
        alt="Fondo"
        className="fixed inset-0 w-full h-full object-cover z-0"
      />

      {/* Título principal */}
      <h1 className="relative z-10 text-white text-center font-display font-extrabold text-[clamp(2rem,8vw,8rem)] drop-shadow-[0_8px_9px_rgba(0,0,0,0.5)] py-6">
        MedManager
      </h1>

      {/* Contenedor de login */}
      <div className="relative z-10 w-[90%] max-w-[50.25rem] bg-white rounded-lg shadow-md p-10 flex flex-col gap-6 border-white border-30">
        <h2 className="text-3xl font-semibold text-black text-center mb-6">
          Inicio de sesión
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-black font-normal mb-2">
              Correo Electrónico:
            </label>
            <input
              type="email"
              placeholder="Ingresa tu correo electrónico"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">
              Contraseña:
            </label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
            />
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
        </div>

        <button className="w-3/5 h-14 bg-[#00AAFF] text-white text-xl font-semibold rounded-md shadow-md hover:brightness-110 transition self-center mt-4">
          Iniciar sesión
        </button>
      </div>

      {/* Registro debajo del contenedor */}
      <div className="relative z-10 mt-10 text-center text-black text-base">
        <span>¿No tienes una cuenta? </span>
        <span className="text-[#76F1FF] font-bold cursor-pointer hover:underline"
          onClick={() => navigate("/register")}>
          Regístrate aquí.
        </span>
      </div>
    </div>
  );
}

export default AppLogin;
