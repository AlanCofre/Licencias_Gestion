import React from 'react';
import './style.css';

function App() {
  return (
    <div className="app-container">
      <img
        className="app-background"
        src="./img/banner-login.png"
        alt="Fondo"
      />

      <div className="main-title">MedManager</div>

      <div className="login-card">
        <div className="login-title">Registro</div>

        <label className="login-label">Nombre y Apellido:</label>
        <input
          type="text"
          placeholder="Ingresa tu nombre y apellido"
          className="login-input"
        />

        <label className="login-label">Correo Electrónico:</label>
        <input
          type="email"
          placeholder="Ingresa tu correo electrónico"
          className="login-input"
        />

        <label className="login-label">Contraseña:</label>
        <input
          type="password"
          placeholder="Ingresa tu contraseña"
          className="login-input"
        />

        <label className="login-label">Confirmar Contraseña:</label>
        <input
          type="password"
          placeholder="Ingresa tu contraseña otra vez"
          className="login-input"
        />

        <button className="login-button">Registrarse</button>
      </div>

      <div className="register">
        <span>¿Ya tienes una cuenta? </span>
        <span className="register-link">Inicia sesión aquí.</span>
      </div>
    </div>
  );
}

export default App;
