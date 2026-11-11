'use strict';

class CitaMedica {
  constructor({
    idCita = null,
    idPaciente,
    idDoctor,
    idRecepcionista = null,
    fechaHora,
    duracionMin = 30,
    estado = 'AGENDADA/PENDIENTE DE PAGO',
    canceladaPor = null,
    motivoCancelacion = null,
    montoAnticipo = 0.0,
    montoTotal = 500.0,
    referenciaBancaria = null,
    reembolso = 0.0,
  }) {
    this._idCita = idCita;
    this._idPaciente = idPaciente;
    this._idDoctor = idDoctor;
    this._idRecepcionista = idRecepcionista;
    this._fechaHora = new Date(fechaHora);
    this._duracionMin = Number(duracionMin);
    this._estado = estado;
    this._canceladaPor = canceladaPor;
    this._motivoCancelacion = motivoCancelacion;
    this._montoAnticipo = parseFloat(montoAnticipo);
    this._montoTotal = parseFloat(montoTotal);
    this._referenciaBancaria = referenciaBancaria;
    this._reembolso = parseFloat(reembolso);
  }

  // Getters
  get idCita() { return this._idCita; }
  get idPaciente() { return this._idPaciente; }
  get idDoctor() { return this._idDoctor; }
  get fechaHora() { return this._fechaHora; }
  get estado() { return this._estado; }
  get montoAnticipo() { return this._montoAnticipo; }
  get montoTotal() { return this._montoTotal; }

  // Métodos de Cambio de Estado
  liquidarPagoRestante() {
    if (this._estado !== 'AGENDADA/PENDIENTE DE PAGO') {
      const err = new Error('Solo se pueden liquidar citas pendientes de pago');
      err.statusCode = 400;
      throw err;
    }
    this._estado = 'PAGADA';
  }

  cancelar({ canceladaPor, motivo, reembolso = 0.0 }) {
    this._estado = 'CANCELADA';
    this._canceladaPor = canceladaPor;
    this._motivoCancelacion = motivo;
    this._reembolso = parseFloat(reembolso);
  }

  toJSON() {
    return {
      idCita: this._idCita,
      idPaciente: this._idPaciente,
      idDoctor: this._idDoctor,
      idRecepcionista: this._idRecepcionista,
      fechaHora: this._fechaHora.toISOString(),
      duracionMin: this._duracionMin,
      estado: this._estado,
      canceladaPor: this._canceladaPor,
      motivoCancelacion: this._motivoCancelacion,
      montoAnticipo: this._montoAnticipo,
      montoTotal: this._montoTotal,
      referenciaBancaria: this._referenciaBancaria,
      reembolso: this._reembolso,
    };
  }
}

module.exports = CitaMedica;