// backend/services/servicio_BusquedaLicencias.js
export class BusquedaLicenciasService {
  static async buscarLicencias(filtros = {}) {
    const {
      estado,
      idUsuario,
      fechaDesde,
      fechaHasta,
      nombreEstudiante,
      folio,
      page = 1,
      limit = 20
    } = filtros;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let condiciones = [];
    let parametros = [];

    // Construir condiciones dinámicamente
    if (estado) {
      condiciones.push('lm.estado = ?');
      parametros.push(estado);
    }

    if (idUsuario) {
      condiciones.push('lm.id_usuario = ?');
      parametros.push(idUsuario);
    }

    if (fechaDesde) {
      condiciones.push('lm.fecha_emision >= ?');
      parametros.push(fechaDesde);
    }

    if (fechaHasta) {
      condiciones.push('lm.fecha_emision <= ?');
      parametros.push(fechaHasta);
    }

    if (nombreEstudiante) {
      condiciones.push('u.nombre LIKE ?');
      parametros.push(`%${nombreEstudiante}%`);
    }

    if (folio) {
      condiciones.push('lm.folio LIKE ?');
      parametros.push(`%${folio}%`);
    }

    const whereClause = condiciones.length > 0 
      ? `WHERE ${condiciones.join(' AND ')}` 
      : '';

    try {
      // Ejecutar consulta principal
      const [licencias] = await db.execute(`
        SELECT 
          lm.id_licencia,
          lm.folio,
          lm.fecha_emision,
          lm.fecha_inicio,
          lm.fecha_fin,
          lm.estado,
          lm.motivo_rechazo,
          lm.fecha_creacion,
          lm.id_usuario,
          u.nombre as estudiante_nombre
        FROM licenciamedica lm
        FORCE INDEX (idx_licencia_completo)
        JOIN usuario u FORCE INDEX (idx_usuario_nombre) ON lm.id_usuario = u.id_usuario
        ${whereClause}
        ORDER BY lm.fecha_creacion DESC
        LIMIT ? OFFSET ?
      `, [...parametros, limitNum, offset]);

      // Contar total (más eficiente que COUNT(*) con LIMIT)
      const [totalResult] = await db.execute(`
        SELECT COUNT(*) as total
        FROM licenciamedica lm
        JOIN usuario u ON lm.id_usuario = u.id_usuario
        ${whereClause}
      `, parametros);

      const total = parseInt(totalResult[0]?.total) || 0;

      return {
        licencias,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      console.error('❌ [BusquedaLicenciasService] Error:', error);
      throw error;
    }
  }

  // Búsqueda rápida por múltiples campos
  static async busquedaRapida(termino, limit = 50) {
    const searchTerm = `%${termino}%`;
    
    const [resultados] = await db.execute(`
      SELECT 
        lm.id_licencia,
        lm.folio,
        lm.estado,
        lm.fecha_emision,
        u.nombre as estudiante_nombre
      FROM licenciamedica lm
      FORCE INDEX (idx_licencia_folio, idx_licencia_completo)
      JOIN usuario u FORCE INDEX (idx_usuario_nombre) ON lm.id_usuario = u.id_usuario
      WHERE lm.folio LIKE ? OR u.nombre LIKE ?
      ORDER BY 
        CASE 
          WHEN lm.folio LIKE ? THEN 1
          ELSE 2
        END,
        lm.fecha_creacion DESC
      LIMIT ?
    `, [searchTerm, searchTerm, searchTerm, limit]);

    return resultados;
  }
}