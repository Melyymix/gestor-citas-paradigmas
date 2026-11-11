'use strict';

const Usuario = require('./Usuario');
const AdministradorArea = require('./AdministradorArea');

class DirectorGeneral extends Usuario {
  constructor(datos) {
    super({ ...datos, rol: 'DIRECTOR_GENERAL' });
  }

  crearCuentaPropia() {
    this.validarDatosBasicos();
    return true;
  }

  registrarAdminArea(datos, area) {
    const admin = new AdministradorArea({
      ...datos,
      idEspecialidad: area.idEspecialidad,
      areaEspecialidad: area.nombre,
    });
    admin.validarDatosBasicos();
    if (!admin.idEspecialidad) {
      throw Usuario.errorValidacion('Debe asignar un área de especialidad');
    }
    return admin;
  }
}

module.exports = DirectorGeneral;
