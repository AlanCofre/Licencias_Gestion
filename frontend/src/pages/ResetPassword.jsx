import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Toast from "../components/toast";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ResetPassword() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const navigate = useNavigate(); // ✅ inicializar navigate

  const handleReset = () => {
    if (!code || !password) {
      setToast({ message: "Completa todos los campos.", type: "error" });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setToast({ message: "Tu contraseña fue restablecida correctamente.", type: "success" });
      setTimeout(() => navigate("/login"), 700);
    }, 1500);
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

          <input
            type="text"
            placeholder="Código de verificación"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />

          <button
            onClick={handleReset}
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? (
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

      {/* Toast global */}
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