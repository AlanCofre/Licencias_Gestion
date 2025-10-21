import React, { useState } from "react";
import bannerLogin from "../assets/banner-login.png";
import logo from "../assets/logo.svg"; // <-- tu logo
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeRole = (rawUser) => {
    let role = "";
    if (rawUser?.id_rol) {
      if (typeof rawUser.id_rol === "object" && rawUser.id_rol.nombre) {
        role = String(rawUser.id_rol.nombre).toLowerCase();
      } else {
        const num = Number(rawUser.id_rol);
        role =
          num === 1 ? "profesor" :
          num === 2 ? "estudiante" :
          num === 3 ? "funcionario" : "";
      }
    } else if (typeof rawUser?.id_rol === "string") role = rawUser.id_rol.toLowerCase();
    else if (typeof rawUser?.rol === "string") role = rawUser.rol.toLowerCase();
    else if (typeof rawUser?.role === "string") role = rawUser.role.toLowerCase();

    if (role === "secretaria" || role === "secretary") role = "funcionario";
    if (role === "alumno") role = "estudiante";
    return role;
  };

  const routeByRole = {
    estudiante: "/alumno",
    profesor: "/profesor",
    funcionario: "/secretaria",
  };

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

      if (!res.ok || !data?.token || !data?.usuario) throw new Error(data?.error || "Credenciales inválidas");

      const rawUser = data.usuario || {};
      const role = normalizeRole(rawUser);
      const normalizedUser = { ...rawUser, role };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      login(normalizedUser, data.token);
      navigate(routeByRole[role] || "/", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center py-12">
      <img
        src={bannerLogin}
        alt="Fondo"
        className="fixed inset-0 w-full h-full object-cover z-0"
      />

      <div className="relative z-10 flex w-[90%] max-w-[50rem] bg-white rounded-lg shadow-md overflow-hidden">
        {/* Logo */}
        <div className="hidden md:flex md:w-1/3 bg-[#00AAFF] flex-col items-center justify-center p-6">
          <img src={logo} alt="Logo" className="w-38 h-auto" />
          <span className="text-white text-4xl font-bold mt-3 text-center">MedManager</span>
        </div>

        {/* Formulario */}
        <div className="w-full md:w-2/3 p-8 flex flex-col gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-black text-center mb-4">
            Inicio de sesión
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-black font-medium mb-1 text-sm">
                Correo Electrónico:
              </label>
              <input
                type="email"
                placeholder="usuario@uct.cl"
                className="w-full bg-[#E0F2FF] rounded-md p-3 text-black text-sm"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-black font-medium mb-1 text-sm">
                Contraseña:
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#E0F2FF] rounded-md p-3 text-black text-sm"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-600 text-xs text-center">{error}</p>}

            <span
              className="text-[#00AAFF] text-xs font-medium cursor-pointer hover:underline text-center mt-1 block"
              onClick={() => navigate("/forgot-password")}
            >
              Olvidé mi contraseña.
            </span>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#00AAFF] text-white text-sm font-semibold rounded-md shadow-md hover:brightness-110 mt-2"
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-4 text-center text-black text-sm">
            <span>¿No tienes una cuenta? </span>
            <span
              className="text-[#76F1FF] font-bold cursor-pointer hover:underline"
              onClick={() => navigate("/registro")}
            >
              Regístrate aquí.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppLogin;
