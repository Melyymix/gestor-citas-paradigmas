'use strict';

const Usuario = require('./Usuario');

class Recepcionista extends Usuario {
  constructor({ idUsuario, nombre, correo, telefono, password, idEspecialidad = null, permisoCancelacionEspecial = false, activo = true }) {
    super({ idUsuario, nombre, correo, telefono, password, rol: 'RECEPCIONISTA', activo });
    this._idEspecialidad = idEspecialidad;
    this._permisoCancelacionEspecial = Boolean(permisoCancelacionEspecial);
  }

  get idEspecialidad() { return this._idEspecialidad; }
  get permisoCancelacionEspecial() { return this._permisoCancelacionEspecial; }

  toJSON() {
    return {
      ...super.toJSON(),
      idEspecialidad: this._idEspecialidad,
      permisoCancelacionEspecial: this._permisoCancelacionEspecial,
    };
  }
}

module.exports = Recepcionista;