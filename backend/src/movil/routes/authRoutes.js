import express from "express";
import bcrypt from "bcrypt";
import db from "../../../config/db.js";
import { registerValidation, loginValidation } from "../validators/authValidators.js";

const router = express.Router();

/**
 * REGISTRO
 */
router.post("/register", registerValidation, async (req, res) => {
  try {
    const { correo_usuario, nombre, contrasena, id_rol } = req.body;

    //Verificar si ya existe el correo
    const [userExists] = await db.query(
      "SELECT * FROM usuario WHERE correo_usuario = ?",
      [correo_usuario]
    );
    if (userExists.length > 0) {
      return res.status(400).json({ success: false, message: "El correo ya está registrado" });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    // Insertar usuario
    await db.query(
      `INSERT INTO usuario (correo_usuario, nombre, contrasena, id_rol) VALUES (?, ?, ?, ?)`,
      [correo_usuario, nombre, hashedPassword, id_rol || 2] // por ejemplo: 2 = estudiante
    );

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: { correo_usuario, nombre },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: error.message,
    });
  }
});

/**
 * 🔐 LOGIN
 */
router.post("/login", loginValidation, async (req, res) => {
  try {
    const { correo_usuario, contrasena } = req.body;

    // Buscar usuario
    const [rows] = await db.query(
      "SELECT * FROM usuario WHERE correo_usuario = ?",
      [correo_usuario]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    const user = rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(contrasena, user.contrasena);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

    // generar JWT aquí más adelante
    res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      data: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        correo_usuario: user.correo_usuario,
        id_rol: user.id_rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
      error: error.message,
    });
  }
});

export default router;