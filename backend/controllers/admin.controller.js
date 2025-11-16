import { Op } from "sequelize";
import Curso from "../src/models/modelo_Curso.js";
import Matricula from "../src/models/modelo_Matricula.js";
import Usuario from "../src/models/modelo_Usuario.js";
import Periodo from "../src/models/modelo_Periodo.js";

export async function listarCursosMatriculas(req, res) {
  try {
    const { periodo, profesor, curso, codigo, seccion, activo } = req.query;

    const whereCurso = {};
    const includePeriodo = [];
    
    // Filtro por periodo activo
    if (activo !== undefined) {
      includePeriodo.push({
        model: Periodo,
        as: "periodo",
        where: { activo: activo === 'true' ? 1 : 0 } // 👈 CORREGIDO: activo es tinyint(1)
      });
    } else if (periodo) {
      // Filtro por código de periodo
      includePeriodo.push({
        model: Periodo,
        as: "periodo",
        where: { codigo: { [Op.like]: `%${periodo}%` } }
      });
    } else {
      includePeriodo.push({
        model: Periodo,
        as: "periodo"
      });
    }
    
    // Filtros del curso
    if (profesor) whereCurso.id_usuario = Number(profesor);
    if (curso) whereCurso.id_curso = Number(curso);
    if (codigo) whereCurso.codigo = { [Op.like]: `%${codigo}%` };
    if (seccion) whereCurso.seccion = Number(seccion);

    const cursos = await Curso.findAll({
      where: whereCurso,
      attributes: [
        "id_curso",
        "codigo",
        "nombre_curso",
        "semestre",
        "seccion",
        "id_periodo",
        "id_usuario",
      ],
      include: [
        {
          model: Usuario,
          as: "profesor",
          attributes: ["id_usuario", "nombre", "correo_usuario"],
        },
        {
          model: Matricula,
          as: "estudiantesMatriculados",
          attributes: ["id_matricula", "id_usuario", "fecha_matricula"], // 👈 CORREGIDO: no existe campo 'estado'
          include: [
            {
              model: Usuario,
              as: "estudiante",
              attributes: ["id_usuario", "nombre", "correo_usuario"],
            },
          ],
        },
        ...includePeriodo
      ],
      order: [
        [{ model: Periodo, as: "periodo" }, "codigo", "DESC"],
        ["nombre_curso", "ASC"],
        [{ model: Matricula, as: "estudiantesMatriculados" }, "id_matricula", "ASC"],
      ],
    });

    const data = cursos.map((c) => ({
      id_curso: c.id_curso,
      codigo: c.codigo,              // ✅ correcto
      nombre_curso: c.nombre_curso,
      semestre: c.semestre,
      seccion: c.seccion,
      periodo: c.periodo
        ? {
            id_periodo: c.periodo.id_periodo,
            codigo: c.periodo.codigo,
            activo: !!c.periodo.activo,
          }
        : null,
      profesor: c.profesor
        ? {
            id: c.profesor.id_usuario,
            nombre: c.profesor.nombre,
            correo: c.profesor.correo_usuario,
          }
        : null,
      matriculados: (c.estudiantesMatriculados ?? []).map((m) => ({
        id_matricula: m.id_matricula,
        id_estudiante: m.estudiante?.id_usuario ?? m.id_usuario,
        nombre: m.estudiante?.nombre ?? null,
        correo: m.estudiante?.correo_usuario ?? null,
        fecha_matricula: m.fecha_matricula ?? null,
      })),
    }));

    return res.json({ ok: true, data });
  } catch (error) {
    console.error("[admin:cursos-matriculas] error:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno al listar cursos y matrículas",
    });
  }
}