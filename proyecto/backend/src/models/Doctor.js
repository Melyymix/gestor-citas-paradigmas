'use strict';

const Database = require('../config/database');
const pool = Database.getPool();

class Doctor {
  /**
   * Obtiene todas las citas pendientes (AGENDADA/PENDIENTE DE PAGO o PAGADA)
   * asignadas al doctor autenticado.
   * @param {number} idDoctor
   * @returns {Promise<Array>}
   */
  static async obtenerCitasPendientes(idDoctor) {
    const [rows] = await pool.execute(
      `SELECT
         c.id_cita        AS idCita,
         c.id_paciente    AS idPaciente,
         c.fecha_hora     AS fechaHora,
         c.estado,
         c.monto_total    AS montoTotal,
         c.monto_anticipo AS montoAnticipo,
         u.nombre         AS nombrePaciente,
         p.curp
       FROM citas_medicas c
       JOIN pacientes p   ON p.id_usuario = c.id_paciente
       JOIN usuarios u    ON u.id_usuario = p.id_usuario
       WHERE c.id_doctor = ?
         AND c.estado IN ('AGENDADA/PENDIENTE DE PAGO', 'PAGADA')
       ORDER BY c.fecha_hora ASC`,
      [idDoctor]
    );
    return rows;
  }

  /**
   * Obtiene el historial clínico (consultas previas) de un paciente.
   * Solo accesible por doctores.
   * @param {number} idPaciente
   * @param {number} idDoctor  - Se valida que haya al menos una cita con este doctor
   * @returns {Promise<Array>}
   */
  static async obtenerExpediente(idPaciente, idDoctor) {
    // Validar que el doctor tenga (o haya tenido) relación con el paciente
    const [[rel]] = await pool.execute(
      `SELECT COUNT(*) AS cnt FROM citas_medicas
       WHERE id_paciente = ? AND id_doctor = ?`,
      [idPaciente, idDoctor]
    );
    if (!rel || rel.cnt === 0) {
      const err = new Error('Acceso denegado: no tiene citas con este paciente');
      err.statusCode = 403;
      throw err;
    }

    const [rows] = await pool.execute(
      `SELECT
         cm.id_consulta          AS idConsulta,
         c.fecha_hora            AS fechaConsulta,
         u.nombre                AS nombreDoctor,
         cm.motivo,
         cm.diagnostico,
         cm.observaciones,
         cm.receta_medicamentos  AS recetaMedicamentos,
         cm.receta_dosis         AS recetaDosis,
         cm.receta_indicaciones  AS recetaIndicaciones,
         cm.creada_en            AS creadaEn
       FROM consultas_medicas cm
       JOIN citas_medicas c ON c.id_cita = cm.id_cita
       JOIN doctores d      ON d.id_usuario = c.id_doctor
       JOIN usuarios u      ON u.id_usuario = d.id_usuario
       WHERE c.id_paciente = ?
       ORDER BY c.fecha_hora DESC`,
      [idPaciente]
    );
    return rows;
  }

  /**
   * Cancela una cita pendiente por parte del doctor.
   * @param {number} idCita
   * @param {number} idDoctor
   * @param {string} motivoCancelacion
   */
  static async cancelarCita(idCita, idDoctor, motivoCancelacion) {
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
      const err = new Error('Solo se pueden cancelar citas pendientes o pagadas');
      err.statusCode = 400;
      throw err;
    }

    await pool.execute(
      `UPDATE citas_medicas
       SET estado = 'CANCELADA',
           cancelada_por = 'DOCTOR',
           motivo_cancelacion = ?
       WHERE id_cita = ?`,
      [motivoCancelacion || 'Cancelada por el doctor', idCita]
    );
  }
}

module.exports = Doctor;
