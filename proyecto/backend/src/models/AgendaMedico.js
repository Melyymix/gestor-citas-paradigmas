'use strict';

class AgendaMedico {
  constructor({ idDoctor, horarioSemanal = [], citasAgendadas = [] }) {
    this._idDoctor = idDoctor;
    this._horarioSemanal = horarioSemanal; // Arreglo de bloques de horario laboral (día, horaInicio, horaFin)
    this._citasAgendadas = citasAgendadas; // Arreglo de citas activas del doctor
  }

  get idDoctor() {
    return this._idDoctor;
  }

  get horarioSemanal() {
    return this._horarioSemanal;
  }

  get citasAgendadas() {
    return this._citasAgendadas;
  }

  /**
   * Método de la entidad según el diseño POO:
   * Marca o remueve la cita cancelada liberando el bloque en la agenda del doctor.
   */
  liberarHorario(idCita) {
    this._citasAgendadas = this._citasAgendadas.filter(cita => cita.idCita !== idCita);
    return true;
  }

  /**
   * Verifica si un horario solicitado cae dentro de la jornada laboral del médico.
   */
  estaEnHorarioLaboral(fechaHora) {
    const diaSemana = fechaHora.getDay();
    const horaMinutos = fechaHora.toTimeString().split(' ')[0];

    return this._horarioSemanal.some(bloque => {
      return bloque.diaSemana === diaSemana &&
        horaMinutos >= bloque.horaInicio &&
        horaMinutos < bloque.horaFin;
    });
  }

  toJSON() {
    return {
      idDoctor: this._idDoctor,
      horarioSemanal: this._horarioSemanal,
      totalCitasAgendadas: this._citasAgendadas.length,
    };
  }
}

module.exports = AgendaMedico;