angular.module('gestorCitasApp').factory('CitaService', ['$http', 'API_URL', 'AuthService', function($http, API_BASE, AuthService) {
  function config(params) {
    return { headers: AuthService.getAuthHeaders(), params: params };
  }

  return {
    // Agendar Cita (Paciente o Recepcionista)
    agendarCita: function(datosCita) {
      return $http.post(API_BASE + '/citas', datosCita, config());
    },
    // Cancelación normal (Paciente >= 48h)
    cancelarPorPaciente: function(idCita) {
      return $http.put(API_BASE + '/citas/' + idCita + '/cancelar-paciente', {}, config());
    },
    cancelarPorRecepcion: function(idCita) {
      return $http.put(API_BASE + '/citas/' + idCita + '/cancelar-recepcion', {}, config());
    },
    // Cancelación especial en Recepción
    cancelarEspecial: function(idCita, motivo, canceladaPor) {
      return $http.put(API_BASE + '/citas/' + idCita + '/cancelar-especial', {
        motivo: motivo,
        canceladaPor: canceladaPor
      }, config());
    },
    // Pago de saldo restante en efectivo
    registrarPago: function(idCita) {
      return $http.put(API_BASE + '/citas/' + idCita + '/pagar', {}, config());
    },
    // Obtener mis citas (Paciente)
    obtenerMisCitasPaciente: function() {
      return $http.get(API_BASE + '/pacientes/mis-citas', config());
    },
    // Registro de paciente en caja
    registrarPacienteRecepcion: function(datosPaciente) {
      return $http.post(API_BASE + '/recepcion/pacientes', datosPaciente, config());
    },
    // Consultar doctores por especialidad
    consultarDoctores: function(especialidadId) {
      return $http.get(API_BASE + '/recepcion/catalogos/doctores', config({ especialidadId: especialidadId }));
    },
    // Consultar horarios de un doctor
    consultarHorariosDoctor: function(idDoctor) {
      return $http.get(API_BASE + '/recepcion/horarios-doctor/' + idDoctor, config());
    }
  };
}]);