'use strict';

const Database = require('../config/database');
const AgendaMedico = require('../models/AgendaMedico');

class AgendaService {
  /**
   * Obtiene la agenda completa de un doctor: sus horarios laborales y sus citas activas.
   */
  static async obtenerAgendaDoctor(idDoctor) {
    // 1. Consultar horario semanal de trabajo del doctor
    const horarios = await Database.query(
      `SELECT id_horario, dia_semana, hora_inicio, hora_fin 
       FROM horarios_doctor 
       WHERE id_doctor = ? 
       ORDER BY dia_semana, hora_inicio`,
      [idDoctor]
    );

    // 2. Consultar citas activas (no canceladas) del doctor
    const citas = await Database.query(
      `SELECT id_cita, fecha_hora, duracion_min, estado 
       FROM citas_medicas 
       WHERE id_doctor = ? AND estado <> 'CANCELADA' 
       ORDER BY fecha_hora ASC`,
      [idDoctor]
    );

    return new AgendaMedico({
      idDoctor: parseInt(idDoctor, 10),
      horarioSemanal: horarios,
      citasAgendadas: citas
    });
  }

  /**
   * Consulta los bloques disponibles de un doctor para una fecha determinada.
   */
  static async consultarDisponibilidad(idDoctor, fechaStr) {
    const fecha = new Date(fechaStr);
    const diaSemana = fecha.getDay();

    // Consultar el horario del doctor para ese día de la semana
    const bloquesHorario = await Database.query(
      `SELECT hora_inicio, hora_fin 
       FROM horarios_doctor 
       WHERE id_doctor = ? AND dia_semana = ?`,
      [idDoctor, diaSemana]
    );

    // Consultar citas ya ocupadas en esa fecha específica
    const citasOcupadas = await Database.query(
      `SELECT fecha_hora 
       FROM citas_medicas 
       WHERE id_doctor = ? AND DATE(fecha_hora) = DATE(?) AND estado <> 'CANCELADA'`,
      [idDoctor, fechaStr]
    );

    return {
      idDoctor: parseInt(idDoctor, 10),
      fecha: fechaStr,
      jornadaLaboral: bloquesHorario,
      citasOcupadas: citasOcupadas.map(c => c.fecha_hora)
    };
  }
}

module.exports = AgendaService;