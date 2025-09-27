import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function EditProfile() {
  const navigate = useNavigate(); // hook para navegación

  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);

  // Datos simulados
  const [formData, setFormData] = useState({
    nombre: "Juan Pérez López ",
    rut: "12.345.678-9",
    correoInstitucional: "juan@example.com",
    telefono: "",
    correoAlternativo: "",
    direccion: "",
    idioma: "",
    recuperarContrasena: "",
  });

  // Manejar cambios en inputs
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setProfilePic(file);
    }
  };

  // Guardar datos (por ahora solo consola)
  const handleSave = (e) => {
    e.preventDefault();
    console.log("Datos a guardar:", formData, profilePic);
    alert("Datos guardados");
  };

  return (
    <div className="relative min-h-screen bg-blue-100 flex flex-col items-center py-12">

      <h1 className="text-4xl font-bold text-center mb-12 py-2"> Perfil</h1>

      <form
        className="w-[90%] max-w-[50rem] bg-white rounded-lg shadow-md p-10 flex flex-col gap-8 border-white border-30"
        onSubmit={handleSave}
      >
        {/* Foto */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Foto
              </div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
        </div>
        {/* Nombre */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-black">Nombre completo:</label> 
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            readOnly
            className="w-full p-4 rounded-md border border-gray-300 bg-gray-100 text-gray-700"
          />
        </div>
        {/* RUT */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-black">RUT:</label>
          <input 
            type="text"
            name="rut"
            value={formData.rut}
            pattern="\d{1,2}\.\d{3}\.\d{3}-[\dkK]"
            readOnly
            className="w-full p-4 rounded-md border border-gray-300 bg-gray-100 text-gray-700"
          />
        </div>

        {/* Telefono */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-black">Teléfono de contacto:</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="+56 9 1234 5678"
            pattern="[+0-9\s\-]{8,15}"
            required
            className="w-full p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {/* Correo institucional */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-black">Correo institucional:</label>  
          <input
            type="email"
            name="correoInstitucional"
            value={formData.correoInstitucional}
            readOnly
            className="w-full p-4 rounded-md border border-gray-300 bg-gray-100 text-gray-700"
          />
        </div>

        {/* Correo alternativo */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-black">Correo alternativo:</label>
          <input
            type="email"
            name="correoAlternativo"
            value={formData.correoAlternativo}
            onChange={handleChange}
            placeholder="correo@alternativo.com"
            required
            className="w-full p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Dirección */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-black">Dirección particular:</label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Calle, número, ciudad"
            required
            className="w-full p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Idioma */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-black">Idioma:</label>
          <select
            name="idioma"
            value={formData.idioma}
            onChange={handleChange}
            required
            className="w-full p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Selecciona idioma</option>
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="fr">Francés</option>
          </select>
        </div>

        {/* Recuperar contraseña con diseño mejorado */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-black">Recuperar contraseña:</label>
          <button
            type="button"
            onClick={() => navigate("/reset-password")}
            className="
              w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Cambiar / Recuperar contraseña
          </button>
        </div>

        {/* Guardar cambios */}
        <button
          type="submit"
          className="w-3/5 self-center h-14 bg-[#00AAFF] text-white font-semibold rounded-md shadow-md hover:brightness-110 transition transform hover:-translate-y-0.5"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

export default EditProfile;
