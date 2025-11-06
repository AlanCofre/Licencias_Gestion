import { Op } from "sequelize";
import Curso from "../src/models/modelo_Curso.js";
import Matricula from "../src/models/modelo_Matricula.js";
import Usuario from "../src/models/modelo_Usuario.js";

export async function listarCursosMatriculas(req, res) {
  try {
    const { periodo, profesor, curso, codigo, seccion, activo } = req.query;

    const whereCurso = {};
    if (periodo) whereCurso.periodo = { [Op.like]: `%${periodo}%` };
    if (profesor) whereCurso.id_usuario = Number(profesor);
    if (curso) whereCurso.id_curso = Number(curso);
    if (codigo) whereCurso.codigo = { [Op.like]: `%${codigo}%` };
    if (seccion) whereCurso.seccion = Number(seccion);
    if (activo === undefined) whereCurso.activo = 1;
    else whereCurso.activo = Number(activo);

    const cursos = await Curso.findAll({
      where: whereCurso,
      attributes: [
        "id_curso",
        "codigo",
        "nombre_curso",
        "semestre",
        "seccion",
        "periodo",
        "activo",
        "id_usuario",
      ],
      include: [
        {
          model: Usuario,
          as: "profesor", // 👈 alias exacto de index.js
          attributes: ["id_usuario", "nombre", "correo_usuario"],
        },
        {
          model: Matricula,
          as: "estudiantesMatriculados", // 👈 alias exacto de index.js
          attributes: ["id_matricula", "id_usuario", "estado", "fecha_matricula"],
          include: [
            {
              model: Usuario,
              as: "estudiante",
              attributes: ["id_usuario", "nombre", "correo_usuario"],
            },
          ],
        },
      ],
      order: [
        ["periodo", "DESC"],
        ["nombre_curso", "ASC"],
        [{ model: Matricula, as: "estudiantesMatriculados" }, "id_matricula", "ASC"],
      ],
    });

    const data = cursos.map((c) => ({
      id_curso: c.id_curso,
      codigo: c.codigo,
      nombre_curso: c.nombre_curso,
      semestre: c.semestre,
      seccion: c.seccion,
      periodo: c.periodo,
      activo: !!c.activo,
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
        estado: m.estado ?? "activa",
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
