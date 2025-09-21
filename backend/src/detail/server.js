const express = require('express');
const app = express();
const DetailsRouter = require('./details');
const db = require('./db'); // ← asegurate de importar tu conexión

app.use(express.json());
app.use('/', DetailsRouter);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');

  // Ejecutar consulta al iniciar
  (async () => {
    try {
      const [licencias] = await db.execute(
        'SELECT * FROM licenciamedica ORDER BY fecha_emision DESC LIMIT 5'
      );
      console.log('📦 Licencias precargadas al iniciar:', licencias);
    } catch (err) {
      console.error('❌ Error al precargar licencias:', err);
    }
  })();
});
