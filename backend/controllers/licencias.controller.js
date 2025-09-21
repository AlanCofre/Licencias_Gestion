// Lista las licencias del usuario autenticado
export const listarLicencias = async (req, res) => {
  try {
    res.json({
      msg: 'Listado de licencias del usuario',
      usuarioId: req.id,
      rol: req.rol,
      data: [
        { id: 1, motivo: 'Reposo médico', fecha_inicio: '2025-09-10', fecha_fin: '2025-09-20' },
        { id: 2, motivo: 'Cirugía',       fecha_inicio: '2025-08-01', fecha_fin: '2025-08-15' }
      ]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al listar licencias' });
  }
};

// Crea una nueva licencia (solo estudiantes)
export const crearLicencia = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, motivo } = req.body;
    if (!fecha_inicio || !fecha_fin || !motivo) {
      return res.status(400).json({ msg: 'Faltan datos obligatorios' });
    }
    const nuevaLicencia = {
      id: Math.floor(Math.random() * 1000),
      usuarioId: req.id,
      rol: req.rol,
      fecha_inicio,
      fecha_fin,
      motivo
    };
    res.status(201).json({ msg: 'Licencia creada con éxito', licencia: nuevaLicencia });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear la licencia' });
  }
};
