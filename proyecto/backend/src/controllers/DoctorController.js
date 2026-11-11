'use strict';

const ConsultaMedicaService = require('../services/ConsultaMedicaService');

class DoctorController {
  /**
   * GET /api/doctor/citas-pendientes
   * Devuelve citas pendientes del doctor autenticado.
   */
  static async obtenerCitasPendientes(req, res, next) {
    try {
      const idDoctor = req.usuario.id_usuario;
      const citas = await ConsultaMedicaService.obtenerCitasPendientes(idDoctor);
      res.json({ ok: true, citas });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/doctor/expediente/:idPaciente
   * Devuelve el historial clínico de un paciente (solo doctores autorizados).
   */
  static async obtenerExpediente(req, res, next) {
    try {
      const idDoctor = req.usuario.id_usuario;
      const idPaciente = Number(req.params.idPaciente);
      const expediente = await ConsultaMedicaService.obtenerExpediente(idPaciente, idDoctor);
      res.json({ ok: true, expediente });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/doctor/consulta
   * Registra una consulta médica y pasa la cita a REALIZADA.
   * Body: { idCita, motivo, diagnostico, observaciones?,
   *         recetaMedicamentos?, recetaDosis?, recetaIndicaciones? }
   */
  static async registrarConsulta(req, res, next) {
    try {
      const idDoctor = req.usuario.id_usuario;
      const { idCita, motivo, diagnostico, observaciones,
              recetaMedicamentos, recetaDosis, recetaIndicaciones } = req.body;

      if (!idCita || !motivo || !diagnostico) {
        return res.status(400).json({ ok: false, mensaje: 'idCita, motivo y diagnóstico son requeridos' });
      }

      const resultado = await ConsultaMedicaService.registrarConsulta({
        idCita, idDoctor, motivo, diagnostico, observaciones,
        recetaMedicamentos, recetaDosis, recetaIndicaciones,
      });

      res.status(201).json({ ok: true, mensaje: 'Consulta registrada correctamente', ...resultado });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/doctor/citas/:idCita/cancelar
   * Cancela una cita pendiente por parte del doctor.
   * Body: { motivoCancelacion }
   */
  static async cancelarCita(req, res, next) {
    try {
      const idDoctor = req.usuario.id_usuario;
      const idCita = Number(req.params.idCita);
      const { motivoCancelacion } = req.body;

      await ConsultaMedicaService.cancelarCita(idCita, idDoctor, motivoCancelacion);
      res.json({ ok: true, mensaje: 'Cita cancelada correctamente' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DoctorController;
