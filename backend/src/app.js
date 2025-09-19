import express from 'express';
import usuarioRoutes from './routes/ruta_Usuario.js';

const app = express();

app.use(express.json());
app.use('/usuarios', usuarioRoutes);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
