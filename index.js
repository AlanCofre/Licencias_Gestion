// Cargar las variables de entorno del archivo .env
require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');

// Inicializar la aplicación Express
const app = express();

// Middleware para que Express pueda entender JSON en el cuerpo de las peticiones
app.use(express.json());

// --- CONFIGURACIÓN ---
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("Error: La variable de entorno JWT_SECRET no está definida.");
  process.exit(1);
}

// --- BASE DE DATOS SIMULADA ---
// En una aplicación real, esto vendría de una base de datos.
const users = [
  { id: 1, username: 'user.student', password: 'password123', role: 'Estudiante' },
  { id: 2, username: 'user.admin', password: 'password456', role: 'Admin' },
  { id: 3, username: 'user.doctor', password: 'password789', role: 'Doctor' }
];

// --- RUTAS PÚBLICAS ---

// Ruta raíz para comprobar que el servidor funciona
app.get('/', (req, res) => {
  res.send('Servidor de autenticación JWT está funcionando!');
});

/**
 * PASO 1: Generar un token JWT al momento de iniciar sesión.
 * El rol se incluye en el payload.
 */
app.post('/login', (req, res) => {
  // Extraer credenciales del cuerpo de la petición
  const { username, password } = req.body;

  // Buscar al usuario en nuestra base de datos simulada
  const user = users.find(u => u.username === username && u.password === password);

  // Si el usuario no existe o la contraseña es incorrecta
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  // Crear el payload para el JWT
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role // Incluimos el rol en el payload
  };

  // Firmar el token
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // El token expira en 1 hora

  // Enviar el token al cliente
  res.json({
    message: 'Inicio de sesión exitoso',
    token: token
  });
});


// --- MIDDLEWARES DE SEGURIDAD ---

/**
 * PASO 2: Implementar un middleware de autenticación que valide el token.
 */
const verifyToken = (req, res, next) => {
  // Obtener el token de la cabecera 'Authorization'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
  }

  // Verificar el token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      // Si el token no es válido (expirado, manipulado, etc.)
      return res.status(403).json({ message: 'Token inválido.' });
    }
    // Si el token es válido, guardamos el payload decodificado en la petición
    req.user = decoded;
    next(); // Continuar con la siguiente función en la ruta
  });
};

/**
 * PASO 3: Implementar un middleware de autorización que restrinja rutas por rol.
 * Esta es una función de orden superior que devuelve un middleware.
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // El middleware `verifyToken` ya debe haber puesto `req.user`
    const userRole = req.user.role;

    if (allowedRoles.includes(userRole)) {
      next(); // El rol del usuario está permitido, continuar.
    } else {
      res.status(403).json({ message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` });
    }
  };
};


// --- RUTAS PROTEGIDAS ---
// A estas rutas solo se puede acceder con un token JWT válido.

/**
 * PASO 4: Ejemplo de ruta protegida para cualquier usuario autenticado.
 */
app.get('/perfil', verifyToken, (req, res) => {
  // Gracias al middleware `verifyToken`, aquí tenemos acceso a `req.user`
  res.json({
    message: `Bienvenido a tu perfil, ${req.user.username}.`,
    user: req.user
  });
});

/**
 * PASO 5: Ejemplo de ruta protegida solo para el rol 'Estudiante'.
 */
app.get('/estudiante/dashboard', verifyToken, checkRole(['Estudiante']), (req, res) => {
  res.json({
    message: 'Bienvenido al dashboard de Estudiante.',
    user: req.user
  });
});

/**
 * Ejemplo adicional: Ruta protegida para roles 'Admin' o 'Doctor'.
 */
app.get('/gestion/licencias', verifyToken, checkRole(['Admin', 'Doctor']), (req, res) => {
  res.json({
    message: 'Acceso al sistema de gestión de licencias médicas.',
    user: req.user
  });
});


// --- INICIAR EL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Rutas disponibles:');
  console.log('  POST /login (público)');
  console.log('  GET /perfil (autenticado)');
  console.log('  GET /estudiante/dashboard (rol Estudiante)');
  console.log('  GET /gestion/licencias (roles Admin, Doctor)');
});
