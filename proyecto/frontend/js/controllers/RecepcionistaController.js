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

  $scope.nuevaCita = { montoAnticipo: 100, montoTotal: 500 };
  $scope.cancelacion = {};
  $scope.doctores = [];
  $scope.horariosDoctor = [];
  $scope.dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  CitaService.consultarDoctores().then(function(res) {
    $scope.doctores = res.data.doctores;
  }, function() {
    $scope.mensajeError = 'No se pudo cargar el catálogo de doctores';
  });

  $scope.consultarHorario = function() {
    const idDoctor = $scope.nuevaCita.idDoctor;
    $scope.horariosDoctor = [];
    if (!idDoctor) return;
    CitaService.consultarHorariosDoctor(idDoctor).then(function(res) {
      if ($scope.nuevaCita.idDoctor === idDoctor) $scope.horariosDoctor = res.data.horarios;
    }, function() {
      if ($scope.nuevaCita.idDoctor === idDoctor) $scope.mensajeError = 'No se pudo cargar el horario';
    });
  };

  function ejecutar(operacion, mensaje, limpiar) {
    $scope.mensajeError = '';
    $scope.mensajeExito = '';
    return operacion.then(function(res) {
      $scope.mensajeExito = mensaje(res.data);
      limpiar();
    }, function(err) {
      $scope.mensajeError = (err.data && (err.data.error || err.data.mensaje)) || 'No se pudo completar la operación';
    });
  }

  $scope.agendarCita = function() {
    if ($scope.agendando) return;
    $scope.agendando = true;
    ejecutar(CitaService.agendarCita($scope.nuevaCita), function(data) {
      return 'Cita agendada. Folio ' + data.cita.idCita + '.';
    }, function() {
      $scope.nuevaCita = { montoAnticipo: 100, montoTotal: 500 };
      $scope.horariosDoctor = [];
    }).finally(function() { $scope.agendando = false; });
  };

  $scope.cancelarCita = function() {
    if ($scope.cancelando || !window.confirm('¿Cancelar la cita ' + $scope.cancelacion.idCita + '?')) return;
    $scope.cancelando = true;
    ejecutar(CitaService.cancelarPorRecepcion($scope.cancelacion.idCita), function(data) {
      return data.mensaje;
    }, function() {
      $scope.cancelacion = {};
    }).finally(function() { $scope.cancelando = false; });
  };

  // Registrar Paciente desde Recepción
  $scope.registrarPaciente = function() {
    $scope.mensajeError = '';
    $scope.mensajeExito = '';

    CitaService.registrarPacienteRecepcion($scope.nuevoPaciente).then(function(res) {
      $scope.mensajeExito = res.data.mensaje + '. ID de paciente: ' + res.data.paciente.idUsuario;
      $scope.nuevoPaciente = {};
    }, function(err) {
      $scope.mensajeError = (err.data && (err.data.error || err.data.mensaje)) || 'Error al registrar paciente';
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
      $scope.mensajeError = (err.data && (err.data.error || err.data.mensaje)) || 'Error al registrar el pago';
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
      $scope.mensajeError = (err.data && (err.data.error || err.data.mensaje)) || 'Error al realizar cancelación especial';
    });
  };
}]);