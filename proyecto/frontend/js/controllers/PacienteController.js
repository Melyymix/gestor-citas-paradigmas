angular.module('gestorCitasApp').controller('PacienteController', ['$scope', 'CitaService', function($scope, CitaService) {
  $scope.misCitas = [];
  $scope.doctores = [];
  $scope.horariosDoctor = [];
  $scope.mensajeError = '';
  $scope.mensajeExito = '';

  $scope.nuevaCita = {
    especialidadId: '',
    idDoctor: '',
    fechaHora: '',
    referenciaBancaria: '',
    montoAnticipo: 100, // 20% por defecto sobre $500
    montoTotal: 500
  };

  // Cargar las citas del paciente al iniciar la pantalla
  $scope.cargarMisCitas = function() {
    CitaService.obtenerMisCitasPaciente().then(function(res) {
      $scope.misCitas = res.data.citas;
    }, function(err) {
      $scope.mensajeError = err.data.error || 'Error al cargar las citas';
    });
  };

  // Al cambiar la especialidad, cargar doctores
  $scope.alCambiarEspecialidad = function() {
    if (!$scope.nuevaCita.especialidadId) return;
    CitaService.consultarDoctores($scope.nuevaCita.especialidadId).then(function(res) {
      $scope.doctores = res.data.doctores;
    });
  };

  // Al seleccionar doctor, cargar sus horarios
  $scope.alSeleccionarDoctor = function() {
    if (!$scope.nuevaCita.idDoctor) return;
    CitaService.consultarHorariosDoctor($scope.nuevaCita.idDoctor).then(function(res) {
      $scope.horariosDoctor = res.data.horarios;
    });
  };

  // Agendar cita con validaciones en cliente
  $scope.agendarCita = function() {
    $scope.mensajeError = '';
    $scope.mensajeExito = '';

    CitaService.agendarCita($scope.nuevaCita).then(function(res) {
      $scope.mensajeExito = res.data.mensaje;
      $scope.cargarMisCitas();
      $scope.nuevaCita = { montoAnticipo: 100, montoTotal: 500 };
    }, function(err) {
      $scope.mensajeError = err.data.error || 'No se pudo agendar la cita';
    });
  };

  // Cancelar cita por parte del paciente (Regla de >= 48h)
  $scope.cancelarCita = function(idCita) {
    if (!confirm('¿Seguro que deseas cancelar esta cita?')) return;
    $scope.mensajeError = '';
    $scope.mensajeExito = '';

    CitaService.cancelarPorPaciente(idCita).then(function(res) {
      $scope.mensajeExito = res.data.mensaje;
      $scope.cargarMisCitas();
    }, function(err) {
      $scope.mensajeError = err.data.error || 'Error al cancelar la cita';
    });
  };

  $scope.cargarMisCitas();
}]);