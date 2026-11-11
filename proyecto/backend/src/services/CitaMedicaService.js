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
    if (!fechaHora || !Number.isFinite(fechaCita.getTime()) ||
        ![idPaciente, idDoctor].every(id => Number.isInteger(Number(id)) && Number(id) > 0)) {
      throw Object.assign(new Error('Indica un paciente, un doctor y una fecha válidos'), { statusCode: 400 });
    }

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
    if (!Number.isFinite(Number(montoAnticipo)) || !Number.isFinite(Number(montoTotal)) ||
        Number(montoTotal) <= 0 || Number(montoAnticipo) > Number(montoTotal) ||
        Number(montoAnticipo) < anticipoMinimo) {
      const err = new Error(`El anticipo debe ser igual o mayor al 20% del costo total ($${anticipoMinimo.toFixed(2)})`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Validación de Horario Laboral del Doctor
    const zonaClinica = 'America/Mexico_City';
    const dia = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: zonaClinica }).format(fechaCita);
    const diaSemana = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dia);
    const horaMinutosCita = new Intl.DateTimeFormat('en-GB', {
      timeStyle: 'medium', timeZone: zonaClinica,
    }).format(fechaCita);

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

    const connection = await Database.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('SELECT id_usuario FROM doctores WHERE id_usuario = ? FOR UPDATE', [idDoctor]);
      const [empalmes] = await connection.execute(
        `SELECT id_cita FROM citas_medicas
         WHERE id_doctor = ? AND estado <> 'CANCELADA'
           AND fecha_hora < DATE_ADD(?, INTERVAL 30 MINUTE)
           AND DATE_ADD(fecha_hora, INTERVAL duracion_min MINUTE) > ? LIMIT 1`,
        [idDoctor, fechaCita, fechaCita]
      );
      if (empalmes.length) {
        throw Object.assign(new Error('El doctor ya tiene una cita en ese horario'), { statusCode: 409 });
      }
      const [result] = await connection.execute(
        `INSERT INTO citas_medicas 
          (id_paciente, id_doctor, id_recepcionista, fecha_hora, estado, monto_anticipo, monto_total, referencia_bancaria) 
         VALUES (?, ?, ?, ?, 'AGENDADA/PENDIENTE DE PAGO', ?, ?, ?)`,
        [idPaciente, idDoctor, idRecepcionista, fechaCita, montoAnticipo, montoTotal, referenciaBancaria]
      );

      await connection.commit();
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
      await connection.rollback();
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw Object.assign(new Error('El paciente o el doctor no existe'), { statusCode: 404 });
      }
      if (error.code === 'ER_DUP_ENTRY') {
        const err = new Error('El doctor ya tiene una cita en ese horario');
        err.statusCode = 400;
        throw err;
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * REGLA DE NEGOCIO: Cancelar Cita por Paciente
   */
  static async cancelarPorPaciente(idCita, idPaciente) {
    return this.cancelarOrdinaria(idCita, { idPaciente });
  }

  static async cancelarOrdinaria(idCita, { idPaciente = null, idRecepcionista = null }) {
    const [cita] = await Database.query(
      'SELECT estado, fecha_hora, monto_anticipo FROM citas_medicas WHERE id_cita = ? AND (? IS NULL OR id_paciente = ?)',
      [idCita, idPaciente, idPaciente]
    );
    if (!cita) throw Object.assign(new Error('Cita no encontrada'), { statusCode: 404 });
    if (!['AGENDADA/PENDIENTE DE PAGO', 'PAGADA'].includes(cita.estado)) {
      throw Object.assign(new Error('Solo se pueden cancelar citas activas'), { statusCode: 409 });
    }
    if (new Date(cita.fecha_hora).getTime() - Date.now() < 48 * 60 * 60 * 1000) {
      throw Object.assign(new Error('La cancelación ordinaria requiere al menos 48 horas de anticipación'), { statusCode: 400 });
    }

    const result = await Database.query(
      `UPDATE citas_medicas
       SET estado = 'CANCELADA', cancelada_por = ?, motivo_cancelacion = 'Cancelación ordinaria',
           id_recepcionista = COALESCE(?, id_recepcionista), reembolso = monto_anticipo
       WHERE id_cita = ? AND estado = ?`,
      [idRecepcionista ? 'RECEPCIONISTA' : 'PACIENTE', idRecepcionista, idCita, cita.estado]
    );
    if (!result.affectedRows) {
      throw Object.assign(new Error('El estado de la cita cambió. Consulta la cita e inténtalo de nuevo'), { statusCode: 409 });
    }
    return { mensaje: 'Cita cancelada. Se registró el reembolso del anticipo.', reembolso: cita.monto_anticipo };
  }

  /**
   * REGLA DE NEGOCIO: Cancelación Especial (Recepcionista)
   */
  static async cancelarEspecialRecepcion(idCita, idRecepcionista, motivo, canceladaPor = 'RECEPCIONISTA') {
    if (typeof motivo !== 'string' || !motivo.trim() || motivo.length > 255 ||
        !['RECEPCIONISTA', 'DOCTOR'].includes(canceladaPor)) {
      throw Object.assign(new Error('Indica un origen y una justificación válidos'), { statusCode: 400 });
    }
    const rows = await Database.query(`SELECT * FROM citas_medicas WHERE id_cita = ?`, [idCita]);
    if (!rows || rows.length === 0) throw Object.assign(new Error('Cita no encontrada'), { statusCode: 404 });

    const citaData = rows[0];
    if (!['AGENDADA/PENDIENTE DE PAGO', 'PAGADA'].includes(citaData.estado)) {
      throw Object.assign(new Error('Solo se pueden cancelar citas activas'), { statusCode: 409 });
    }
    const ahora = new Date();
    const fechaCita = new Date(citaData.fecha_hora);
    const horasRestantes = (fechaCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    let reembolso = 0.0;
    if (canceladaPor === 'DOCTOR' || horasRestantes >= 48) {
      reembolso = citaData.monto_anticipo;
    }

    const result = await Database.query(
      `UPDATE citas_medicas
       SET estado = 'CANCELADA', cancelada_por = ?, motivo_cancelacion = ?, id_recepcionista = ?, reembolso = ?
       WHERE id_cita = ? AND estado = ?`,
      [canceladaPor, motivo.trim(), idRecepcionista, reembolso, idCita, citaData.estado]
    );
    if (!result.affectedRows) {
      throw Object.assign(new Error('El estado de la cita cambió'), { statusCode: 409 });
    }

    return { mensaje: 'Cancelación procesada exitosamente', reembolso };
  }

  /**
   * REGLA DE NEGOCIO: Pago de saldo restante en efectivo (Recepcionista)
   */
  static async registrarPagoRestante(idCita, idRecepcionista) {
    const rows = await Database.query(`SELECT * FROM citas_medicas WHERE id_cita = ?`, [idCita]);
    if (!rows || rows.length === 0) throw Object.assign(new Error('Cita no encontrada'), { statusCode: 404 });

    const cita = new CitaMedica({ estado: rows[0].estado });
    cita.liquidarPagoRestante();

    const result = await Database.query(
      `UPDATE citas_medicas SET estado = 'PAGADA', id_recepcionista = ?
       WHERE id_cita = ? AND estado = 'AGENDADA/PENDIENTE DE PAGO'`,
      [idRecepcionista, idCita]
    );
    if (!result.affectedRows) {
      throw Object.assign(new Error('El estado de la cita cambió'), { statusCode: 409 });
    }

    return { mensaje: 'Pago liquidado en efectivo. Estado actualizado a PAGADA' };
  }
}

module.exports = CitaMedicaService;