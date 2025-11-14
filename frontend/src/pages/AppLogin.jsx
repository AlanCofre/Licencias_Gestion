import React, { useState } from "react";
import bannerLogin from "../assets/banner-login.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

function AppLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [roleSelect, setRoleSelect] = useState("alumno");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const userData = { name: "Usuario Demo", role: roleSelect };
      login(userData);
      setLoading(false);

      switch (roleSelect) {
        case "secretaria":
          navigate("/secretaria", { replace: true });
          break;
        case "profesor":
          navigate("/profesor", { replace: true });
          break;
        case "admin":
          navigate("/admin", { replace: true });
          break;
        default:
          navigate("/alumno", { replace: true });
      }
    }, 700);
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-start py-12">
      {/* Fondo */}
      <img
        src={bannerLogin}
        alt={t("login.bannerAlt")}
        className="fixed inset-0 w-full h-full object-cover z-0"
      />

      {/* Título principal */}
      <h1 className="relative z-10 text-white text-center font-extrabold text-[clamp(2rem,8vw,8rem)] drop-shadow-[0_8px_9px_rgba(0,0,0,0.5)] mb-12 font-display">
        MedManager
      </h1>

      {/* Contenedor de login */}
      <div className="relative z-10 w-[90%] max-w-[50.25rem] bg-white rounded-lg shadow-md p-10 flex flex-col gap-6 border-white border-30">
        <h2 className="text-3xl font-semibold text-black text-center mb-6">
          {t("login.selectUserType")}
        </h2>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          <div>
            <label className="block text-black font-medium mb-4 text-lg">
              {t("login.howAccess")}
            </label>
            <div className="space-y-3">
              {/* Opción Alumno */}
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="role"
                  value="alumno"
                  checked={roleSelect === "alumno"}
                  onChange={(e) => setRoleSelect(e.target.value)}
                  className="mr-3"
                  disabled={loading}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t("roles.student")}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("roles.studentDesc")}
                  </div>
                </div>
              </label>

              {/* Opción Secretaria */}
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="role"
                  value="secretaria"
                  checked={roleSelect === "secretaria"}
                  onChange={(e) => setRoleSelect(e.target.value)}
                  className="mr-3"
                  disabled={loading}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t("roles.secretary")}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("roles.secretaryDesc")}
                  </div>
                </div>
              </label>

              {/* Profesor */}
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="role"
                  value="profesor"
                  checked={roleSelect === "profesor"}
                  onChange={(e) => setRoleSelect(e.target.value)}
                  className="mr-3"
                  disabled={loading}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t("roles.teacher")}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("roles.teacherDesc")}
                  </div>
                </div>
              </label>

              {/* Administrador */}
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={roleSelect === "admin"}
                  onChange={(e) => setRoleSelect(e.target.value)}
                  className="mr-3"
                  disabled={loading}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t("roles.admin")}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("roles.adminDesc")}
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-14 bg-[#00AAFF] text-white text-xl font-semibold rounded-md hover:brightness-110 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t("login.loading") : t("login.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AppLogin;
