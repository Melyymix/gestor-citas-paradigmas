'use strict';

const pool = require('../config/database');

class ConsultaMedica {
  /**
   * Registra una nueva consulta médica y marca la cita como REALIZADA.
   * @param {object} datos
   * @param {number} datos.idCita
   * @param {number} datos.idDoctor  - Para validar pertenencia
   * @param {string} datos.motivo
   * @param {string} datos.diagnostico
   * @param {string} [datos.observaciones]
   * @param {string} [datos.recetaMedicamentos]
   * @param {string} [datos.recetaDosis]
   * @param {string} [datos.recetaIndicaciones]
   * @returns {Promise<number>} idConsulta generado
   */
  static async crear(datos) {
    const { idCita, idDoctor, motivo, diagnostico, observaciones, recetaMedicamentos, recetaDosis, recetaIndicaciones } = datos;

    // Validar que la cita exista, pertenezca al doctor y esté en estado válido
    const [[cita]] = await pool.execute(
      `SELECT id_cita, estado FROM citas_medicas
       WHERE id_cita = ? AND id_doctor = ?`,
      [idCita, idDoctor]
    );

    if (!cita) {
      const err = new Error('Cita no encontrada o no pertenece a este doctor');
      err.statusCode = 404;
      throw err;
    }

    if (!['AGENDADA/PENDIENTE DE PAGO', 'PAGADA'].includes(cita.estado)) {
      const err = new Error('La cita no está en un estado que permita registrar consulta');
      err.statusCode = 400;
      throw err;
    }

    // Verificar que no exista ya una consulta para esta cita
    const [[existente]] = await pool.execute(
      `SELECT id_consulta FROM consultas_medicas WHERE id_cita = ?`,
      [idCita]
    );
    if (existente) {
      const err = new Error('Ya existe una consulta registrada para esta cita');
      err.statusCode = 409;
      throw err;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [resultado] = await conn.execute(
        `INSERT INTO consultas_medicas
           (id_cita, motivo, diagnostico, observaciones,
            receta_medicamentos, receta_dosis, receta_indicaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [idCita, motivo, diagnostico, observaciones || null,
         recetaMedicamentos || null, recetaDosis || null, recetaIndicaciones || null]
      );

      await conn.execute(
        `UPDATE citas_medicas SET estado = 'REALIZADA' WHERE id_cita = ?`,
        [idCita]
      );

      await conn.commit();
      return resultado.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Obtiene una consulta por su ID.
   * @param {number} idConsulta
   * @returns {Promise<object|null>}
   */
  static async obtenerPorId(idConsulta) {
    const [[row]] = await pool.execute(
      `SELECT
         cm.*,
         c.fecha_hora   AS fechaCita,
         c.id_paciente  AS idPaciente,
         c.id_doctor    AS idDoctor
       FROM consultas_medicas cm
       JOIN citas_medicas c ON c.id_cita = cm.id_cita
       WHERE cm.id_consulta = ?`,
      [idConsulta]
    );
    return row || null;
  }
}

module.exports = ConsultaMedica;
