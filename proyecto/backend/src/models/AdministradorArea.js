'use strict';

const Usuario = require('./Usuario');

class AdministradorArea extends Usuario {
  constructor({ idEspecialidad = null, areaEspecialidad = '', ...datos }) {
    super({ ...datos, rol: 'ADMIN_AREA' });
    this._idEspecialidad = idEspecialidad ? Number(idEspecialidad) : null;
    this._areaEspecialidad = areaEspecialidad ? String(areaEspecialidad).trim() : '';
  }

  get idEspecialidad() {
    return this._idEspecialidad;
  }

  get areaEspecialidad() {
    return this._areaEspecialidad;
  }

  registrarDoctor(datos) {
    const doctor = new Usuario({ ...datos, rol: 'DOCTOR' });
    doctor.validarDatosBasicos();
    if (!this._idEspecialidad) {
      throw Usuario.errorValidacion('El administrador no tiene un área de especialidad asignada');
    }
    return {
      usuario: doctor,
      idEspecialidad: this._idEspecialidad,
      cedulaProfesional: datos.cedulaProfesional ? String(datos.cedulaProfesional).trim() : null,
      horarios: Array.isArray(datos.horarios) ? datos.horarios : [],
    };
  }

  registrarRecepcionista(datos) {
    const recepcionista = new Usuario({ ...datos, rol: 'RECEPCIONISTA' });
    recepcionista.validarDatosBasicos();
    return {
      usuario: recepcionista,
      idEspecialidad: this._idEspecialidad,
      permisoCancelacionEspecial: Boolean(datos.permisoCancelacionEspecial),
    };
  }

  registrarPaciente(datos) {
    const paciente = new Usuario({ ...datos, rol: 'PACIENTE' });
    paciente.validarDatosBasicos();
    const curp = datos.curp ? String(datos.curp).trim().toUpperCase() : '';
    if (!curp || curp.length !== 18) {
      throw Usuario.errorValidacion('La CURP es obligatoria y debe tener 18 caracteres');
    }
    return {
      usuario: paciente,
      curp,
    };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      idEspecialidad: this._idEspecialidad,
      areaEspecialidad: this._areaEspecialidad,
    };
  }
}

module.exports = AdministradorArea;
