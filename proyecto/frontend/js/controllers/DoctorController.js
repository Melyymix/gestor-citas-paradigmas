'use strict';

angular.module('gestorCitasApp').controller('DoctorController', [
  '$scope',
  'AuthService',
  'DoctorService',
  function ($scope, AuthService, DoctorService) {
    $scope.usuario = AuthService.getUsuario();
    $scope.citasPendientes = [];
    $scope.citaSeleccionada = null;
    $scope.expedientePaciente = [];
    $scope.error = '';
    $scope.mensaje = '';
    $scope.cargando = false;

    function crearConsultaVacia() {
      return {
        motivo: '',
        diagnostico: '',
        observaciones: '',
        recetaMedicamentos: '',
        recetaDosis: '',
        recetaIndicaciones: '',
      };
    }

    $scope.nuevaConsulta = crearConsultaVacia();

    $scope.cargarCitas = function () {
      $scope.error = '';
      $scope.cargando = true;
      DoctorService.obtenerCitasPendientes()
        .then(function (citas) {
          $scope.citasPendientes = citas || [];
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'Error al cargar citas pendientes';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };

    $scope.atenderCita = function (cita) {
      $scope.citaSeleccionada = cita;
      $scope.error = '';
      $scope.mensaje = '';
      $scope.nuevaConsulta = crearConsultaVacia();
      $scope.nuevaConsulta.motivo = 'Consulta de valoración — CURP: ' + (cita.curp || 'N/A');

      DoctorService.obtenerExpediente(cita.idPaciente)
        .then(function (expediente) {
          $scope.expedientePaciente = expediente || [];
        })
        .catch(function (err) {
          $scope.expedientePaciente = [];
          $scope.error = (err.data && err.data.mensaje) || 'Error al consultar expediente clínico';
        });
    };

    $scope.guardarConsulta = function () {
      if (!$scope.citaSeleccionada) return;
      $scope.error = '';
      $scope.mensaje = '';
      $scope.cargando = true;

      var payload = {
        idCita: $scope.citaSeleccionada.idCita,
        motivo: $scope.nuevaConsulta.motivo,
        diagnostico: $scope.nuevaConsulta.diagnostico,
        observaciones: $scope.nuevaConsulta.observaciones,
        recetaMedicamentos: $scope.nuevaConsulta.recetaMedicamentos,
        recetaDosis: $scope.nuevaConsulta.recetaDosis,
        recetaIndicaciones: $scope.nuevaConsulta.recetaIndicaciones,
      };

      DoctorService.registrarConsulta(payload)
        .then(function (res) {
          $scope.mensaje = res.mensaje || 'Consulta registrada correctamente';
          $scope.citaSeleccionada = null;
          $scope.nuevaConsulta = crearConsultaVacia();
          $scope.cargarCitas();
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'Error al guardar la consulta médica';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };

    $scope.cancelarCita = function (cita) {
      var motivo = prompt('Ingrese el motivo de la cancelación de la cita:');
      if (!motivo) return;
      $scope.error = '';
      $scope.mensaje = '';
      $scope.cargando = true;

      DoctorService.cancelarCita(cita.idCita, motivo)
        .then(function (res) {
          $scope.mensaje = res.mensaje || 'Cita cancelada correctamente';
          if ($scope.citaSeleccionada && $scope.citaSeleccionada.idCita === cita.idCita) {
            $scope.citaSeleccionada = null;
          }
          $scope.cargarCitas();
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'Error al cancelar la cita';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };

    $scope.cargarCitas();
  },
]);