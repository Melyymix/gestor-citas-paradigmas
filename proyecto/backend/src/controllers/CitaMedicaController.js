'use strict';

const CitaMedicaService = require('../services/CitaMedicaService');

class CitaMedicaController {
  // POST /api/citas
  static async agendarCita(req, res) {
    try {
      const { idPaciente, idDoctor, fechaHora, referenciaBancaria, montoAnticipo, montoTotal } = req.body;
      const idRecepcionista = req.usuario?.rol === 'RECEPCIONISTA' ? req.usuario.idUsuario : null;
      // Si el usuario autenticado es PACIENTE, tomamos su ID directamente del token/sesión
      const pacienteIdFinal = req.usuario?.rol === 'PACIENTE' ? req.usuario.idUsuario : idPaciente;

      const nuevaCita = await CitaMedicaService.agendarCita({
        idPaciente: pacienteIdFinal,
        idDoctor,
        idRecepcionista,
        fechaHora,
        referenciaBancaria,
        montoAnticipo,
        montoTotal
      });

      res.status(201).json({
        ok: true,
        mensaje: 'Cita agendada exitosamente en estado AGENDADA/PENDIENTE DE PAGO',
        cita: nuevaCita
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ ok: false, error: error.message });
    }
  }

  // PUT /api/citas/:id/cancelar-paciente
  static async cancelarPorPaciente(req, res) {
    try {
      const { id } = req.params;
      const idPaciente = req.usuario.idUsuario; // Obtenido del middleware de autenticación

      const resultado = await CitaMedicaService.cancelarPorPaciente(id, idPaciente);
      res.status(200).json({ ok: true, ...resultado });
    } catch (error) {
      res.status(error.statusCode || 500).json({ ok: false, error: error.message });
    }
  }

  // PUT /api/citas/:id/cancelar-especial
  static async cancelarEspecial(req, res) {
    try {
      const { id } = req.params;
      const { motivo, canceladaPor } = req.body; // canceladaPor: 'RECEPCIONISTA' o 'DOCTOR'
      const idRecepcionista = req.usuario.idUsuario;

      const resultado = await CitaMedicaService.cancelarEspecialRecepcion(id, idRecepcionista, motivo, canceladaPor);
      res.status(200).json({ ok: true, ...resultado });
    } catch (error) {
      res.status(error.statusCode || 500).json({ ok: false, error: error.message });
    }
  }

  // PUT /api/citas/:id/pagar
  static async registrarPago(req, res) {
    try {
      const { id } = req.params;
      const idRecepcionista = req.usuario.idUsuario;

      const resultado = await CitaMedicaService.registrarPagoRestante(id, idRecepcionista);
      res.status(200).json({ ok: true, ...resultado });
    } catch (error) {
      res.status(error.statusCode || 500).json({ ok: false, error: error.message });
    }
  }
}

module.exports = CitaMedicaController;