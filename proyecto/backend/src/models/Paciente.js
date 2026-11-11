'use strict';

const Usuario = require('./Usuario');

class Paciente extends Usuario {
  constructor({ idUsuario, nombre, correo, telefono, password, curp, activo = true }) {
    super({ idUsuario, nombre, correo, telefono, password, rol: 'PACIENTE', activo });
    this._curp = curp ? String(curp).trim().toUpperCase() : '';
  }

  get curp() {
    return this._curp;
  }

  validarDatos({ exigirPassword = true } = {}) {
    super.validarDatosBasicos({ exigirPassword });
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!this._curp || !curpRegex.test(this._curp)) {
      throw Usuario.errorValidacion('El CURP ingresado no es válido (debe tener 18 caracteres en formato oficial)');
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      curp: this._curp,
    };
  }
}

module.exports = Paciente;