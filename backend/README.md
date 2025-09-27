# Conexión Backend a MySQL (Sequelize) By Alan

## Requisitos
- Node 18+
- npm
- .env con:
  DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, PORT

## Arranque
npm run dev
# http://localhost:3000

## Endpoints
- GET /db/health   -> verifica conexión (sequelize.authenticate)
- GET /licencias   -> listado básico (si hay datos)

## Estado actual
- Código y estructura OK.
- Conexión remota rechazada: ECONNREFUSED 3306 (bloqueo de red/infra).
- Soluciones propuestas:
  1) VPN o whitelist de IP hacia mysql.inf.uct.cl
  2) Túnel SSH local->remoto (127.0.0.1:3307 -> mysql.inf.uct.cl:3306)
  3) MySQL local para desarrollo (cambiar .env)

## Notas
- No se exponen secretos (.env ignorado).
- Para ambientes con SSL, usar DB_SSL=true y configurar dialectOptions.
- Hecho: Conexión a MySQL por Sequelize implementada; endpoints de verificación y listado, variables por entorno, logs y documentación.
- Resultado: Servidor operativo; conexión remota rechazada por políticas de red (ECONNREFUSED).
- Bloqueante externo: Requiere VPN/whitelist o túnel SSH.
- Siguiente paso: Infra (TI) o aplicar túnel; como alternativa, desarrollar contra MySQL local y luego apuntar a remoto.

###################################################################################################VICTOR#####################################
VICTOOOR

0) Requisitos previos (rápido)
XAMPP con MySQL encendido.


Backend corriendo con .env (en backend/.env) y AUTH_MOCK=false.


DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=a2019_acofre
DB_SSL=false

PORT=3000
JWT_SECRET=SUPER_SECRET_KEY
JWT_EXPIRES_IN=1d
AUTH_MOCK=false



1) Crea la BD y las tablas (una vez)
En phpMyAdmin → selecciona tu BD a2019_acofre (o créala) → pestaña SQL y ejecuta:
-- (si la BD no existe, créala y úsala)
CREATE DATABASE IF NOT EXISTS a2019_acofre CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE a2019_acofre;

-- Tabla de roles
CREATE TABLE IF NOT EXISTS rol (
  id_rol INT PRIMARY KEY,
  nombre VARCHAR(20) UNIQUE NOT NULL
);

-- Poblamos roles
INSERT IGNORE INTO rol (id_rol, nombre) VALUES
  (1,'profesor'),
  (2,'estudiante'),
  (3,'secretario');

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo_usuario VARCHAR(120) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  id_rol INT NOT NULL,
  FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);


2) Genera el hash bcrypt de la contraseña
En una nueva terminal dentro de backend/:
node --input-type=module -e "import('bcryptjs').then(b=>console.log(b.hashSync('123456',10)))"

Copia el hash que sale (algo como $2b$10$...).

3) Inserta un usuario ESTUDIANTE en SQL
En phpMyAdmin → SQL:
INSERT INTO usuario (nombre, correo_usuario, contrasena, activo, id_rol)
VALUES ('Juan Estudiante', 'estudiante@demo.com', '<PEGA_AQUI_EL_HASH>', 1, 2);

(1 = estudiante)
Opcional (para probar ruta de profesor después):
INSERT INTO usuario (nombre, correo_usuario, contrasena, activo, id_rol)
VALUES ('Ana Profesora', 'profesor@demo.com', '<MISMO_HASH_Otro>', 1, 1);


4) Verifica que quedó bien
SELECT id_usuario, correo_usuario, id_rol, activo,
       CHAR_LENGTH(contrasena) AS len
FROM usuario
WHERE correo_usuario IN ('estudiante@demo.com','profesor@demo.com');

len ≈ 60 (si es mucho menos, no es un hash válido).


activo debe ser 1.



5) Haz login (Thunder Client)
POST http://localhost:3000/usuarios/login
 Body (JSON):
{ "correo": "estudiante@demo.com", "contrasena": "123456" }

Respuesta esperada:
{
  "mensaje": "Login exitoso",
  "usuario": { "id": 1, "nombre": "...", "correo": "estudiante@demo.com", "rol": "estudiante" },
  "token": "eyJ..."
}

Copia el token.

6) Demuestra autenticación y autorización por rol
En cada request protegida agrega el header:
Authorization: Bearer <TU_TOKEN>

A) Ruta protegida para cualquier autenticado
GET http://localhost:3000/api/licencias/mis-licencias → 200 OK
 (Muestra que el JWT se valida correctamente).
B) Ruta solo ESTUDIANTE
POST http://localhost:3000/api/licencias/crear
 Body:
{ "fecha_inicio": "2025-10-01", "fecha_fin": "2025-10-05", "motivo": "Reposo médico" }

Con token de estudiante → 200/201 
 Con token de profesor/secretario → 403 
 (Muestra que esEstudiante funciona).
C) Ruta profesor/secretario
GET http://localhost:3000/api/licencias/revisar
 Con token de estudiante → 403 
 Con token de profesor → 200 
 (Muestra que tieneRol('profesor','secretario') funciona).

7) Qué estás demostrando exactamente
JWT: login devuelve un token firmado (se usa en Authorization: Bearer).


Autenticación: sin token o con token inválido → 401.


Autorización por rol:


crear solo con estudiante (403 si no).


revisar solo con profesor/secretario (403 si estudiante).



Errores comunes (y solución)
401 en login: usuario no existe / hash no coincide / BD no conectada.


401 en rutas: faltó Authorization: Bearer <token> o token expirado.


403: rol del token no cumple (correcto para demostrar restricciones).


“secretOrPrivateKey must have a value”: no se cargó JWT_SECRET del .env (asegura dotenv.config en server.js).




##############################################################################################################################################

FABIAN 


requisitos previos:
  dentro del .env se tendra que agregar el:
  JWT_SECRET=devsecret
  JWT_EXPIRES=1d


  despues verificar la ubicacion dentro de la consola
  si muestra:
  C:\Users\fhsv0\OneDrive\Escritorio\integracion 2 MedLeave\Licencias_Gestion\
  se hace un "cd backend"

  se tiene que tener un rol dentro de la base de datos y para verificar la base de datos se usa xamp o mysqlworkplace, para xampp se activa mysql y apache y se va a:
  http://localhost/phpmyadmin/

para el testeo de inicio sesion se tienen 2 formas

solo inicio sesion y registro:
  se hace un "npm start" o "npm run dev"

  dentro del buscador se agrega:
  http://localhost:3000/usuarios/login

  y se prueba el registro y inicio de sesion
  finalmente si se inicia sesion efectivamente se redirige a un index vacio

prueba general:
  se hace un npm run dev y se va a:
  http://127.0.0.1:5500/backend/test/m_index.html
  dentro de este se prueba todo lo relacionado al usuario
  todo se mostrará en consola 
  

##############################################################################################################################################

FRANCO

tareas adjuntar archivo de licencia y ver detalle de licencia

1) registrar un usuario con su respectivo rol de estudiante en la bd mediante PHPMyAdmin.

2) levantar el servidor con “node ./ruta/server.js“ en la terminal (muy probablemente de error al querer iniciar porque no encuentre los paquetes, simplemente ve instalando uno por uno los que te pida hasta que inicie correctamente).

3) levantar “adjuntarLic.html“ adjuntar un archivo de prueba (puede ser una imagen random), llenar los campos sobre los detalles, la fecha de emision y de creacion de autocompletan asi como el id de licencia al que va asociado el archivo, la licencia va asociada al usuario con el que se hizo login.

4) los detalles de las licencias almacenadas se mostraran automaticamente al correr server.js en la terminal de vsc, si la bd esta vacia no se mostrara nada, por eso se recomienda reiniciar el servidor una vez se haya registrado una licencia en la bd para ver el funcionamiento completo.
