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

    const hoy = new Date();
    const inicioSemana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    inicioSemana.setDate(inicioSemana.getDate() - (inicioSemana.getDay() + 6) % 7);
    let semana = new Date(inicioSemana);

    function fechaLocal(fecha) {
      return [fecha.getFullYear(), fecha.getMonth(), fecha.getDate()].join('-');
    }

    const formatoDia = new Intl.DateTimeFormat('es-MX', { weekday: 'short' });

    function actualizarAgenda() {
      const citasPorDia = new Map();
      $scope.citasPendientes.forEach(function (cita) {
        const clave = fechaLocal(new Date(cita.fechaHora));
        if (!citasPorDia.has(clave)) citasPorDia.set(clave, []);
        citasPorDia.get(clave).push(cita);
      });

      $scope.diasAgenda = Array.from({ length: 7 }, function (_, indice) {
        const fecha = new Date(semana);
        fecha.setDate(fecha.getDate() + indice);
        const clave = fechaLocal(fecha);
        return {
          fecha,
          etiqueta: formatoDia.format(fecha),
          hoy: clave === fechaLocal(hoy),
          citas: citasPorDia.get(clave) || [],
        };
      });
      $scope.totalSemana = $scope.diasAgenda.reduce((total, dia) => total + dia.citas.length, 0);
      const formato = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
      $scope.rangoSemana = formato.formatRange(semana, $scope.diasAgenda[6].fecha);
    }

    $scope.cambiarSemana = function (direccion) {
      semana.setDate(semana.getDate() + direccion * 7);
      actualizarAgenda();
    };

    $scope.irAHoy = function () {
      semana = new Date(inicioSemana);
      actualizarAgenda();
    };

    actualizarAgenda();

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
          actualizarAgenda();
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
      $scope.expedientePaciente = [];
      $scope.error = '';
      $scope.mensaje = '';
      $scope.nuevaConsulta = crearConsultaVacia();
      $scope.nuevaConsulta.motivo = 'Consulta de valoración — CURP: ' + (cita.curp || 'N/A');

      DoctorService.obtenerExpediente(cita.idPaciente)
        .then(function (expediente) {
          if ($scope.citaSeleccionada === cita) $scope.expedientePaciente = expediente || [];
        })
        .catch(function (err) {
          if ($scope.citaSeleccionada !== cita) return;
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
