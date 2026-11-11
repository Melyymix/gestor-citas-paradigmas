angular.module('gestorCitasApp').controller('RecepcionistaController', ['$scope', 'CitaService', function($scope, CitaService) {
  $scope.mensajeError = '';
  $scope.mensajeExito = '';

  $scope.nuevoPaciente = {
    nombre: '',
    correo: '',
    telefono: '',
    password: '',
    curp: ''
  };

  $scope.pagoEnCaja = {
    idCita: ''
  };

  $scope.cancelacionEspecial = {
    idCita: '',
    motivo: '',
    canceladaPor: 'RECEPCIONISTA'
  };

  // Registrar Paciente desde Recepción
  $scope.registrarPaciente = function() {
    $scope.mensajeError = '';
    $scope.mensajeExito = '';

    CitaService.registrarPacienteRecepcion($scope.nuevoPaciente).then(function(res) {
      $scope.mensajeExito = res.data.mensaje;
      $scope.nuevoPaciente = {};
    }, function(err) {
      $scope.mensajeError = err.data.error || 'Error al registrar paciente';
    });
  };

  // Procesar pago restante en efectivo ($390 restantes)
  $scope.procesarPago = function() {
    $scope.mensajeError = '';
    $scope.mensajeExito = '';

    CitaService.registrarPago($scope.pagoEnCaja.idCita).then(function(res) {
      $scope.mensajeExito = res.data.mensaje;
      $scope.pagoEnCaja.idCita = '';
    }, function(err) {
      $scope.mensajeError = err.data.error || 'Error al registrar el pago';
    });
  };

  // Procesar Cancelación Especial
  $scope.procesarCancelacionEspecial = function() {
    $scope.mensajeError = '';
    $scope.mensajeExito = '';

    CitaService.cancelarEspecial(
      $scope.cancelacionEspecial.idCita,
      $scope.cancelacionEspecial.motivo,
      $scope.cancelacionEspecial.canceladaPor
    ).then(function(res) {
      $scope.mensajeExito = res.data.mensaje;
      $scope.cancelacionEspecial = { canceladaPor: 'RECEPCIONISTA' };
    }, function(err) {
      $scope.mensajeError = err.data.error || 'Error al realizar cancelación especial';
    });
  };
}]);