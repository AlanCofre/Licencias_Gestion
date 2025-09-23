import React from "react";
import bannerLogin from "../assets/banner-login.png";

function AppRegistro() {
  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-start py-12">
      {/* Fondo */}
      <img
        src={bannerLogin}
        alt="Fondo"
        className="fixed inset-0 w-full h-full object-cover z-0"
      />

      {/* Título principal */}
      <h1 className="relative z-10 text-white text-center font-extrabold text-[clamp(2rem,8vw,8rem)] drop-shadow-[0_8px_9px_rgba(0,0,0,0.5)] mb-12">
        MedManager
      </h1>

      {/* Contenedor de login/registro */}
      <div className="relative z-10 w-[90%] max-w-[50.25rem] bg-white rounded-lg shadow-md py-5 flex flex-col gap-10 items-center justify-center border-white border-30">
        <h2 className="text-3xl font-semibold text-black text-center">Registro</h2>

        <div className="flex flex-col w-xl gap-6 px-10">
          <div>
            <label className="block text-black font-normal mb-2">Nombre y Apellido:</label>
            <input
              type="text"
              placeholder="Ingresa tu nombre y apellido"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">Correo Electrónico:</label>
            <input
              type="email"
              placeholder="Ingresa tu correo electrónico"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">Contraseña:</label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">Confirmar Contraseña:</label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña otra vez"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
            />
          </div>
        </div>

        <button className="w-3/5 h-14 bg-[#00AAFF] text-white text-xl font-semibold rounded-md shadow-md hover:brightness-110 transition self-center">
          Registrarse
        </button>
      </div>

      {/* Registro debajo del contenedor */}
      <div className="relative z-10 mt-10 text-center text-black text-base">
        <span>¿Ya tienes una cuenta? </span>
        <span className="text-[#76F1FF] font-bold cursor-pointer">Inicia sesión aquí.</span>
      </div>
    </div>
  );
}

export default AppRegistro
