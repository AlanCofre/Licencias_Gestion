import React from 'react';
import './style.css';

function App() {
  return (
    <div>
      {/* Fondo */}
      <img
        src="https://placehold.co/1920x1080"
        alt="Fondo"
      />

      {/* Tarjeta blanca central */}
      <div>
        {/* Subtítulo inicio de sesión */}
        <div>Inicio de sesión</div>

        {/* Campo correo electrónico */}
        <label>Correo Electrónico:</label>
        <input
          type="email"
          placeholder="Ingresa tu correo electrónico"
        />

        {/* Campo contraseña */}
        <label>Contraseña:</label>
        <input
          type="password"
          placeholder="Ingresa tu contraseña"
        />

        {/* Botón iniciar sesión */}
        <button>Iniciar sesión</button>
      </div>

      {/* Título principal */}
      <div>MedManager</div>

      {/* Registro */}
      <div>
        <span>¿No tienes una cuenta? </span>
        <span>Regístrate aquí.</span>
      </div>
    </div>
  );
}

export default App;
