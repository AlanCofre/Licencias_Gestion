// backend/services/regularidad.service.js
import db from '../config/db.js';

/**
 * Calcula la regularidad académica de un estudiante basado en licencias médicas aceptadas
 * @param {number} idEstudiante - ID del estudiante
 * @param {string} periodo - Periodo académico (ej: '2025-1')
 * @param {number} idCurso - ID del curso (opcional)
 * @returns {Object} Objeto con conteo y categoría de regularidad
 */
export async function calcularRegularidadEstudiante(idEstudiante, periodo = null, idCurso = null) {
  try {
    // Determinar el período activo si no se especifica
    let periodoActivo = periodo;
    if (!periodoActivo) {
      const [periodos] = await db.execute(
        'SELECT codigo FROM periodos_academicos WHERE activo = 1 ORDER BY id_periodo DESC LIMIT 1'
      );
      periodoActivo = periodos.length > 0 ? periodos[0].codigo : '2025-1';
    }

    let query = `
      SELECT COUNT(DISTINCT lm.id_licencia) as total_licencias_aceptadas
      FROM licenciamedica lm
      WHERE lm.id_usuario = ?
        AND lm.estado = 'aceptado'
        AND YEAR(lm.fecha_creacion) = YEAR(CURDATE())
    `;

    const params = [idEstudiante];

    // Si se especifica un curso, filtrar por él
    if (idCurso) {
      query += ` AND EXISTS (
        SELECT 1 FROM licencias_entregas le 
        WHERE le.id_licencia = lm.id_licencia 
        AND le.id_curso = ?
      )`;
      params.push(idCurso);
    }

    const [result] = await db.execute(query, params);
    
    const totalLicencias = result[0]?.total_licencias_aceptadas || 0;
    
    // Categorizar la regularidad
    let categoria = '';
    if (totalLicencias <= 2) {
      categoria = 'Alta regularidad';
    } else if (totalLicencias <= 5) {
      categoria = 'Media regularidad';
    } else {
      categoria = 'Baja regularidad';
    }

    return {
      total_licencias_aceptadas: totalLicencias,
      categoria_regularidad: categoria,
      periodo: periodoActivo,
      anio_actual: new Date().getFullYear()
    };
  } catch (error) {
    console.error('❌ Error calculando regularidad:', error);
    throw new Error('Error al calcular regularidad académica');
  }
}

/**
 * Obtiene la regularidad de todos los estudiantes de un curso
 * @param {number} idCurso - ID del curso
 * @param {string} periodo - Periodo académico
 * @returns {Array} Lista de estudiantes con su regularidad
 */
export async function obtenerRegularidadPorCurso(idCurso, periodo = null) {
  try {
    // Obtener estudiantes matriculados en el curso
    const [estudiantes] = await db.execute(`
      SELECT 
        u.id_usuario,
        u.nombre,
        u.correo_usuario
      FROM matriculas m
      JOIN usuario u ON m.id_usuario = u.id_usuario
      JOIN rol r ON u.id_rol = r.id_rol
      WHERE m.id_curso = ?
        AND r.nombre_rol = 'estudiante'
    `, [idCurso]);

    // Calcular regularidad para cada estudiante
    const estudiantesConRegularidad = await Promise.all(
      estudiantes.map(async (estudiante) => {
        const regularidad = await calcularRegularidadEstudiante(
          estudiante.id_usuario, 
          periodo, 
          idCurso
        );
        
        return {
          ...estudiante,
          regularidad
        };
      })
    );

    return estudiantesConRegularidad;
  } catch (error) {
    console.error('❌ Error obteniendo regularidad por curso:', error);
    throw new Error('Error al obtener regularidad por curso');
  }
}

/**
 * Obtiene estudiantes con su regularidad para un profesor
 * @param {number} idProfesor - ID del profesor
 * @param {string} periodo - Periodo académico
 * @returns {Array} Lista de estudiantes con su regularidad
 */
export async function obtenerEstudiantesConRegularidad(idProfesor, periodo = null) {
  try {
    // Determinar período activo
    let periodoActivo = periodo;
    if (!periodoActivo) {
      const [periodos] = await db.execute(
        'SELECT codigo FROM periodos_academicos WHERE activo = 1 ORDER BY id_periodo DESC LIMIT 1'
      );
      periodoActivo = periodos.length > 0 ? periodos[0].codigo : '2025-1';
    }

    // Obtener estudiantes matriculados en cursos del profesor
    const [estudiantes] = await db.execute(`
      SELECT DISTINCT
        u.id_usuario,
        u.nombre,
        u.correo_usuario as legajo,
        c.id_curso,
        c.codigo as codigo_curso,
        c.nombre_curso,
        c.seccion,
        CONCAT(c.codigo, ' - ', c.nombre_curso, ' (Sección ', c.seccion, ')') as curso_completo
      FROM matriculas m
      JOIN usuario u ON m.id_usuario = u.id_usuario
      JOIN curso c ON m.id_curso = c.id_curso
      JOIN periodos_academicos p ON c.id_periodo = p.id_periodo
      WHERE c.id_usuario = ?
        AND p.codigo = ?
        AND u.id_rol = 2  -- Rol de estudiante
      ORDER BY u.nombre, c.codigo
    `, [idProfesor, periodoActivo]);

    // Calcular regularidad para cada estudiante
    const estudiantesConRegularidad = await Promise.all(
      estudiantes.map(async (estudiante) => {
        const regularidad = await calcularRegularidadEstudiante(
          estudiante.id_usuario, 
          periodoActivo, 
          estudiante.id_curso
        );
        
        return {
          id: estudiante.id_usuario,
          nombre: estudiante.nombre,
          legajo: estudiante.legajo,
          curso: estudiante.curso_completo,
          codigo_curso: estudiante.codigo_curso,
          seccion: estudiante.seccion,
          regularidad
        };
      })
    );

    return estudiantesConRegularidad;
  } catch (error) {
    console.error('❌ Error obteniendo estudiantes con regularidad:', error);
    throw new Error('Error al obtener estudiantes con regularidad');
  }
}

/**
 * Obtiene estadísticas de regularidad para dashboard
 * @param {number} idProfesor - ID del profesor (opcional para admin)
 * @param {string} periodo - Periodo académico
 * @returns {Object} Estadísticas agregadas
 */
export async function obtenerEstadisticasRegularidad(idProfesor = null, periodo = null) {
  try {
    let periodoActivo = periodo;
    if (!periodoActivo) {
      const [periodos] = await db.execute(
        'SELECT codigo FROM periodos_academicos WHERE activo = 1 ORDER BY id_periodo DESC LIMIT 1'
      );
      periodoActivo = periodos.length > 0 ? periodos[0].codigo : '2025-1';
    }

    let query = `
      SELECT 
        COUNT(DISTINCT u.id_usuario) as total_estudiantes,
        SUM(CASE WHEN lic_count.total_licencias <= 2 THEN 1 ELSE 0 END) as alta_regularidad,
        SUM(CASE WHEN lic_count.total_licencias BETWEEN 3 AND 5 THEN 1 ELSE 0 END) as media_regularidad,
        SUM(CASE WHEN lic_count.total_licencias >= 6 THEN 1 ELSE 0 END) as baja_regularidad
      FROM usuario u
      JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN matriculas m ON u.id_usuario = m.id_usuario
      LEFT JOIN curso c ON m.id_curso = c.id_curso
      LEFT JOIN (
        SELECT 
          lm.id_usuario,
          COUNT(DISTINCT lm.id_licencia) as total_licencias
        FROM licenciamedica lm
        WHERE lm.estado = 'aceptado'
          AND YEAR(lm.fecha_creacion) = YEAR(CURDATE())
        GROUP BY lm.id_usuario
      ) lic_count ON u.id_usuario = lic_count.id_usuario
      WHERE r.id_rol = 2  -- Rol de estudiante
    `;

    const params = [];

    if (idProfesor) {
      query += ` AND c.id_usuario = ?`;
      params.push(idProfesor);
    }

    const [stats] = await db.execute(query, params);
    
    return {
      total_estudiantes: stats[0]?.total_estudiantes || 0,
      alta_regularidad: stats[0]?.alta_regularidad || 0,
      media_regularidad: stats[0]?.media_regularidad || 0,
      baja_regularidad: stats[0]?.baja_regularidad || 0,
      periodo: periodoActivo
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de regularidad:', error);
    throw new Error('Error al obtener estadísticas de regularidad');
  }
}

// NO agregar exportaciones duplicadas al final
// Las funciones ya están exportadas individualmente con 'export'