'use strict';

angular.module('gestorCitasApp').service('DoctorService', [
  '$http',
  'API_URL',
  'AuthService',
  function ($http, API_URL, AuthService) {
    function configAuth() {
      return { headers: AuthService.getAuthHeaders() };
    }

    this.obtenerCitasPendientes = function () {
      return $http.get(API_URL + '/doctor/citas-pendientes', configAuth()).then((res) => res.data.citas);
    };

    this.obtenerExpediente = function (idPaciente) {
      return $http.get(API_URL + '/doctor/expediente/' + idPaciente, configAuth()).then((res) => res.data.expediente);
    };

    this.registrarConsulta = function (datos) {
      return $http.post(API_URL + '/doctor/consulta', datos, configAuth()).then((res) => res.data);
    };

    this.cancelarCita = function (idCita, motivoCancelacion) {
      return $http
        .put(API_URL + '/doctor/citas/' + idCita + '/cancelar', { motivoCancelacion: motivoCancelacion }, configAuth())
        .then((res) => res.data);
    };
  },
]);