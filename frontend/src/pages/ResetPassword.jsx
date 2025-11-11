import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/toast";
import { useConfirmReset } from "../hooks/usePasswordReset"; // Asegúrate de que la ruta sea correcta

export default function ResetPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location?.state?.email || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { confirmReset, loading, error } = useConfirmReset();

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

    try {
      const result = await confirmReset(email, code, password);
      
      setToast({ 
        message: result.message || "Tu contraseña fue restablecida correctamente.", 
        type: "success" 
      });

      // Redirigir al login después de mostrar toast
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      // El error ya se maneja automáticamente en el hook
      console.error("Error al restablecer contraseña:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

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
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={6}
          />

          <input
            type="password"
            placeholder="Nueva contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            minLength={6}
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
            {loading ? "Guardando..." : "Guardar nueva contraseña"}
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