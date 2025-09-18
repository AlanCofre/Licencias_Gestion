import React from 'react';
import './AppLogin.css';

function App() {
  return (
    <div className="app-container">
      <img
        className="app-background"
        src="./public/img/banner-login.png"
        alt="Fondo"
      />

      <div className="login-card">
        <div className="login-title">Inicio de sesión</div>

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
          className="login-input password"
        />

        <button className="login-button">Iniciar sesión</button>
      </div>

      <div className="main-title">MedManager</div>

      <div className="register">
        <span>¿No tienes una cuenta? </span>
        <span>Regístrate aquí.</span>
      </div>
    </div>
  );
}

export default App;
