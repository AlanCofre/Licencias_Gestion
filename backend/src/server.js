const express = require('express');
const cors = require('cors');
const app = express();

// Routers
const DetailsRouter = require('./detail/details');
const InsertRouter = require('./insert/insert');

// Conexión a la base de datos
const db = require('./detail/db');

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/', DetailsRouter);
app.use('/', InsertRouter);

// Inicio del servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');

  // Consulta inicial opcional
  (async () => {
    try {
      const [licencias] = await db.execute(
        'SELECT * FROM licenciamedica ORDER BY fecha_emision DESC LIMIT 5'
      );
      console.log('Licencias precargadas al iniciar:', licencias);
    } catch (err) {
      console.error('Error al precargar licencias:', err);
    }
  })();
});
