// backend/src/routes/ruta_Usuario.js
import { Router } from 'express';
import Usuario from '../models/modelo_Usuario.js';
import LicenciaMedica from '../models/modelo_LicenciaMedica.js';

import { encriptarContrasena, verificarContrasena } from '../../utils/encriptar.js';
import { validarNombre, validarCorreo, validarContrasena } from '../../utils/validaciones.js';

const router = Router();

// Registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;

    // Validaciones
    if (!validarNombre(nombre)) {
      return res.send('<p>❌ Nombre inválido (mínimo 2 caracteres, solo letras y espacios)</p><a href="/">Volver</a>');
    }
    if (!validarCorreo(correo)) {
      return res.send('<p>❌ Correo inválido</p><a href="/">Volver</a>');
    }
    if (!validarContrasena(contrasena)) {
      return res.send('<p>❌ Contraseña inválida (mínimo 6 caracteres)</p><a href="/">Volver</a>');
    }

    // Revisar si ya existe
    const existe = await Usuario.findOne({ where: { correo_usuario: correo } });
    if (existe) {
      return res.send('<p>❌ El correo ya está registrado</p><a href="/">Volver</a>');
    }

    // Encriptar contraseña
    const hash = await encriptarContrasena(contrasena);

    // Crear usuario (rol = 1 por defecto)
    await Usuario.create({
      nombre,
      correo_usuario: correo,
      contrasena: hash,
      activo: 1,
      id_rol: 1
    });

    return res.send('<p>✅ Usuario registrado con éxito</p><a href="/">Iniciar sesión</a>');
  } catch (error) {
    console.error('❌ Error en registro:', error);
    return res.status(500).send('Error en el registro');
  }
});

// 🔹 Login
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { correo_usuario: correo } });
    if (!usuario) {
      return res.send('<p>❌ Usuario no encontrado</p><a href="/">Volver</a>');
    }

    // Verificar contraseña encriptada
    const esValido = await verificarContrasena(contrasena, usuario.contrasena);
    if (!esValido) {
      return res.send('<p>❌ El usuario o la contraseña son incorrectos</p><a href="/">Volver</a>');
    }

    // Si es correcto
    return res.redirect(`/usuarios/home?id=${usuario.id_usuario}`);
  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).send('Error en el login');
  }
});


router.get('/home', async (req, res) => {
  try {
    const id_usuario = req.query.id;

    if (!id_usuario) {
      return res.send('<p>❌ No tienes permisos para ver esta página</p><a href="/">Volver</a>');
    }

    const licencias = await LicenciaMedica.findAll({
      where: { id_usuario },
      order: [['estado', 'ASC']]
    });

    const ultima = await LicenciaMedica.findOne({
      where: { id_usuario },
      order: [['fecha_creacion', 'DESC']]
    });

    // Render HTML
    let html = `
      <h1>📋 Resumen de tus Licencias Médicas</h1>
      <p><strong>Última licencia creada:</strong> 
        ${ultima ? `${ultima.folio} (${ultima.fecha_creacion})` : 'Ninguna'}
      </p>

      <h2>Tus licencias (ordenadas por estado)</h2>
      <table border="1" cellpadding="5">
        <tr>
          <th>ID</th>
          <th>Folio</th>
          <th>Estado</th>
          <th>Fecha Emisión</th>
          <th>Fecha Inicio</th>
          <th>Fecha Fin</th>
        </tr>
    `;

    licencias.forEach(l => {
      html += `
        <tr>
          <td>${l.id_licencia}</td>
          <td>${l.folio}</td>
          <td>${l.estado}</td>
          <td>${l.fecha_emision}</td>
          <td>${l.fecha_inicio}</td>
          <td>${l.fecha_fin}</td>
        </tr>
      `;
    });

    html += `</table><br><a href="/">🔙 Cerrar sesión</a>`;

    res.send(html);

  } catch (error) {
    console.error('❌ Error en /home:', error);
    res.status(500).send('Error al cargar el resumen');
  }
});


export default router;
