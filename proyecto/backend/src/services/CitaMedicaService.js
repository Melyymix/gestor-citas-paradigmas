'use strict';

const Database = require('../config/database');
const CitaMedica = require('../models/CitaMedica');

class CitaMedicaService {
  /**
   * REGLA DE NEGOCIO: Agendar Cita
   */
  static async agendarCita({ idPaciente, idDoctor, idRecepcionista = null, fechaHora, referenciaBancaria, montoAnticipo, montoTotal = 500.0 }) {
    const fechaCita = new Date(fechaHora);
    const ahora = new Date();

    // 1. Validación de Fecha Pasada y 48h de anticipación
    const horasDiferencia = (fechaCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);
    if (horasDiferencia < 0) {
      const err = new Error('La fecha de la cita no puede ser pasada');
      err.statusCode = 400;
      throw err;
    }
    if (horasDiferencia < 48) {
      const err = new Error('La cita requiere al menos 48 horas de anticipación');
      err.statusCode = 400;
      throw err;
    }

    // 2. Validación de Anticipo mínimo del 20% y Referencia Bancaria
    if (!referenciaBancaria || String(referenciaBancaria).trim() === '') {
      const err = new Error('Es obligatorio proporcionar una referencia de pago para registrar el anticipo');
      err.statusCode = 400;
      throw err;
    }
    const anticipoMinimo = montoTotal * 0.20;
    if (parseFloat(montoAnticipo) < anticipoMinimo) {
      const err = new Error(`El anticipo debe ser igual o mayor al 20% del costo total ($${anticipoMinimo.toFixed(2)})`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Validación de Horario Laboral del Doctor
    const diaSemana = fechaCita.getDay();
    const horaMinutosCita = fechaCita.toTimeString().split(' ')[0];

    const horarios = await Database.query(
      `SELECT * FROM horarios_doctor 
       WHERE id_doctor = ? AND dia_semana = ? 
       AND ? >= hora_inicio AND ADDTIME(?, '00:30:00') <= hora_fin`,
      [idDoctor, diaSemana, horaMinutosCita, horaMinutosCita]
    );

    if (!horarios || horarios.length === 0) {
      const err = new Error('El horario solicitado está fuera del horario laboral del doctor');
      err.statusCode = 400;
      throw err;
    }

    // 4. Inserción a la BD
    try {
      const result = await Database.query(
        `INSERT INTO citas_medicas 
          (id_paciente, id_doctor, id_recepcionista, fecha_hora, estado, monto_anticipo, monto_total, referencia_bancaria) 
         VALUES (?, ?, ?, ?, 'AGENDADA/PENDIENTE DE PAGO', ?, ?, ?)`,
        [idPaciente, idDoctor, idRecepcionista, fechaCita, montoAnticipo, montoTotal, referenciaBancaria]
      );

      return new CitaMedica({
        idCita: result.insertId,
        idPaciente,
        idDoctor,
        idRecepcionista,
        fechaHora: fechaCita,
        montoAnticipo,
        montoTotal,
        referenciaBancaria,
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const err = new Error('El doctor ya tiene una cita en ese horario');
        err.statusCode = 400;
        throw err;
      }
      throw error;
    }
  }

  /**
   * REGLA DE NEGOCIO: Cancelar Cita por Paciente
   */
  static async cancelarPorPaciente(idCita, idPaciente) {
    const rows = await Database.query(`SELECT * FROM citas_medicas WHERE id_cita = ? AND id_paciente = ?`, [idCita, idPaciente]);
    if (!rows || rows.length === 0) throw Object.assign(new Error('Cita no encontrada'), { statusCode: 404 });

    const citaData = rows[0];
    if (citaData.estado === 'CANCELADA') throw Object.assign(new Error('La cita ya se encuentra cancelada'), { statusCode: 400 });

    const ahora = new Date();
    const fechaCita = new Date(citaData.fecha_hora);
    const horasRestantes = (fechaCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (horasRestantes < 48) {
      const err = new Error('El paciente únicamente puede cancelar una cita con al menos 48 horas de anticipación');
      err.statusCode = 400;
      throw err;
    }

    const reembolso = citaData.monto_anticipo;

    await Database.query(
      `UPDATE citas_medicas 
       SET estado = 'CANCELADA', cancelada_por = 'PACIENTE', motivo_cancelacion = 'Cancelación por el cliente con >=48h', reembolso = ? 
       WHERE id_cita = ?`,
      [reembolso, idCita]
    );

    return { mensaje: 'Cita cancelada exitosamente. Reembolso total asignado.', reembolso };
  }

  /**
   * REGLA DE NEGOCIO: Cancelación Especial (Recepcionista)
   */
  static async cancelarEspecialRecepcion(idCita, idRecepcionista, motivo, canceladaPor = 'RECEPCIONISTA') {
    const rows = await Database.query(`SELECT * FROM citas_medicas WHERE id_cita = ?`, [idCita]);
    if (!rows || rows.length === 0) throw Object.assign(new Error('Cita no encontrada'), { statusCode: 404 });

    const citaData = rows[0];
    const ahora = new Date();
    const fechaCita = new Date(citaData.fecha_hora);
    const horasRestantes = (fechaCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    let reembolso = 0.0;
    if (canceladaPor === 'DOCTOR' || horasRestantes >= 48) {
      reembolso = citaData.monto_anticipo;
    }

    await Database.query(
      `UPDATE citas_medicas 
       SET estado = 'CANCELADA', cancelada_por = ?, motivo_cancelacion = ?, id_recepcionista = ?, reembolso = ? 
       WHERE id_cita = ?`,
      [canceladaPor, motivo, idRecepcionista, reembolso, idCita]
    );

    return { mensaje: 'Cancelación procesada exitosamente', reembolso };
  }

  /**
   * REGLA DE NEGOCIO: Pago de saldo restante en efectivo (Recepcionista)
   */
  static async registrarPagoRestante(idCita, idRecepcionista) {
    const rows = await Database.query(`SELECT * FROM citas_medicas WHERE id_cita = ?`, [idCita]);
    if (!rows || rows.length === 0) throw Object.assign(new Error('Cita no encontrada'), { statusCode: 404 });

    const cita = new CitaMedica(rows[0]);
    cita.liquidarPagoRestante();

    await Database.query(
      `UPDATE citas_medicas SET estado = 'PAGADA', id_recepcionista = ? WHERE id_cita = ?`,
      [idRecepcionista, idCita]
    );

    return { mensaje: 'Pago liquidado en efectivo. Estado actualizado a PAGADA' };
  }
}

module.exports = CitaMedicaService;