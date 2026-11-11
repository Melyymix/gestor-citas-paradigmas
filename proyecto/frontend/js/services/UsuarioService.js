'use strict';

angular.module('gestorCitasApp').service('UsuarioService', [
  '$http',
  'API_URL',
  'AuthService',
  function ($http, API_URL, AuthService) {
    function configAuth() {
      return { headers: AuthService.getAuthHeaders() };
    }

    this.listarEspecialidades = function () {
      return $http.get(API_URL + '/auth/especialidades').then((res) => res.data.especialidades);
    };

    this.listarAdminsArea = function () {
      return $http.get(API_URL + '/director/admins-area', configAuth()).then((res) => res.data.admins);
    };

    this.registrarAdminArea = function (datos) {
      return $http.post(API_URL + '/director/admins-area', datos, configAuth()).then((res) => res.data);
    };

    this.listarPersonalArea = function () {
      return $http.get(API_URL + '/admin-area/personal', configAuth()).then((res) => res.data);
    };

    this.registrarDoctor = function (datos) {
      return $http.post(API_URL + '/admin-area/doctores', datos, configAuth()).then((res) => res.data);
    };

    this.registrarRecepcionista = function (datos) {
      return $http.post(API_URL + '/admin-area/recepcionistas', datos, configAuth()).then((res) => res.data);
    };

    this.registrarPaciente = function (datos) {
      return $http.post(API_URL + '/admin-area/pacientes', datos, configAuth()).then((res) => res.data);
    };
  },
]);
