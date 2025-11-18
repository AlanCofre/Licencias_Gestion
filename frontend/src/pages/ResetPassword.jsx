import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/toast";
import { useConfirmReset } from "../hooks/usePasswordReset"; // Asegúrate de que la ruta sea correcta
import LoadingSpinner from "../components/LoadingSpinner";

export default function ResetPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location?.state?.email || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { confirmReset, loading, error } = useConfirmReset();
  const [localLoading, setLoading] = useState(false);
  const isLoading = loading || localLoading;

  // Mostrar errores del hook
  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error" });
    }
  }, [error]);

  const handleReset = async () => {
    if (!email || !code || !password) {
      setToast({ message: "Completa todos los campos.", type: "error" });
      return;
    }

    if (password.length < 6) {
      setToast({ message: "La contraseña debe tener al menos 6 caracteres.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      // Intentar llamar al hook confirmReset; soporta dos firmas comunes:
      // confirmReset({ email, code, password }) o confirmReset(email, code, password)
      let res;
      try {
        res = await confirmReset({ email, code, password });
      } catch (err) {
        res = await confirmReset(email, code, password);
      }

      // Normalizar respuesta y comprobar error
      if (res && (res.error || res.ok === false || res.success === false)) {
        const message = res?.error || res?.message || "Error al restablecer contraseña";
        throw new Error(message);
      }

      // Si no hay objeto de resultado, asumimos éxito si no se lanzó excepción
      setToast({ message: "Tu contraseña fue restablecida correctamente.", type: "success" });
      setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      console.error("[ResetPassword] confirmReset error:", err);
      setToast({ message: err?.message || "No se pudo restablecer la contraseña", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Restablecer contraseña
          </h2>
          <p className="text-gray-600 mb-6">
            Ingresa el código que recibiste y tu nueva contraseña.
          </p>

          {/* Campo de email - se prellena automáticamente pero puede editarse si es necesario */}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Código de verificación (6 dígitos)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />

          <input
            type="password"
            placeholder="Nueva contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2 border rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />

          <button
            onClick={handleReset}
            disabled={isLoading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner size="small" color="white" />
                Guardando...
              </div>
            ) : (
              "Guardar nueva contraseña"
            )}
          </button>
        </div>
      </main>

      <Footer />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}