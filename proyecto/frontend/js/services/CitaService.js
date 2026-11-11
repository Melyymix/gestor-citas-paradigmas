angular.module('gestorCitasApp').factory('CitaService', ['$http', function($http) {
  var API_BASE = '/api';

  return {
    // Agendar Cita (Paciente o Recepcionista)
    agendarCita: function(datosCita) {
      return $http.post(API_BASE + '/citas', datosCita);
    },
    // Cancelación normal (Paciente >= 48h)
    cancelarPorPaciente: function(idCita) {
      return $http.put(API_BASE + '/citas/' + idCita + '/cancelar-paciente');
    },
    // Cancelación especial en Recepción
    cancelarEspecial: function(idCita, motivo, canceladaPor) {
      return $http.put(API_BASE + '/citas/' + idCita + '/cancelar-especial', {
        motivo: motivo,
        canceladaPor: canceladaPor
      });
    },
    // Pago de saldo restante en efectivo
    registrarPago: function(idCita) {
      return $http.put(API_BASE + '/citas/' + idCita + '/pagar');
    },
    // Obtener mis citas (Paciente)
    obtenerMisCitasPaciente: function() {
      return $http.get(API_BASE + '/pacientes/mis-citas');
    },
    // Registro de paciente en caja
    registrarPacienteRecepcion: function(datosPaciente) {
      return $http.post(API_BASE + '/recepcion/pacientes', datosPaciente);
    },
    // Consultar doctores por especialidad
    consultarDoctores: function(especialidadId) {
      return $http.get(API_BASE + '/recepcion/catalogos/doctores', {
        params: { especialidadId: especialidadId }
      });
    },
    // Consultar horarios de un doctor
    consultarHorariosDoctor: function(idDoctor) {
      return $http.get(API_BASE + '/recepcion/horarios-doctor/' + idDoctor);
    }
  };
}]);