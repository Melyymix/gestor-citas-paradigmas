'use strict';

const Doctor = require('../models/Doctor');
const ConsultaMedica = require('../models/ConsultaMedica');

class ConsultaMedicaService {
  /**
   * Obtiene citas pendientes del doctor autenticado.
   */
  static async obtenerCitasPendientes(idDoctor) {
    return Doctor.obtenerCitasPendientes(idDoctor);
  }

  /**
   * Obtiene el expediente clínico de un paciente (solo para doctores).
   */
  static async obtenerExpediente(idPaciente, idDoctor) {
    return Doctor.obtenerExpediente(idPaciente, idDoctor);
  }

  /**
   * Registra una consulta médica y pasa la cita a REALIZADA.
   */
  static async registrarConsulta(datos) {
    const idConsulta = await ConsultaMedica.crear(datos);
    return { idConsulta };
  }

  /**
   * Cancela una cita pendiente por parte del doctor.
   */
  static async cancelarCita(idCita, idDoctor, motivoCancelacion) {
    return Doctor.cancelarCita(idCita, idDoctor, motivoCancelacion);
  }
}

module.exports = ConsultaMedicaService;
