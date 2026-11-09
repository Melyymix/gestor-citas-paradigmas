'use strict';

angular.module('gestorCitasApp').service('AuthService', [
  '$http',
  '$rootScope',
  'API_URL',
  function ($http, $rootScope, API_URL) {
    const TOKEN_KEY = 'gcm_token';
    const USER_KEY = 'gcm_usuario';

    this.getToken = function () {
      return localStorage.getItem(TOKEN_KEY);
    };

    this.getUsuario = function () {
      try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (_e) {
        return null;
      }
    };

    this.getAuthHeaders = function () {
      const token = this.getToken();
      return token ? { Authorization: 'Bearer ' + token } : {};
    };

    this.guardarSesion = function (token, usuario) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(usuario));
      $rootScope.$broadcast('sesion:actualizada');
    };

    this.limpiarSesion = function () {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      $rootScope.$broadcast('sesion:actualizada');
    };

    this.login = function (credenciales) {
      return $http.post(API_URL + '/auth/login', credenciales).then((res) => {
        this.guardarSesion(res.data.token, res.data.usuario);
        return res.data;
      });
    };

    this.logout = function () {
      return $http
        .post(API_URL + '/auth/logout', {}, { headers: this.getAuthHeaders() })
        .finally(() => {
          this.limpiarSesion();
        });
    };

    this.registroPaciente = function (datos) {
      return $http.post(API_URL + '/auth/registro-paciente', datos).then((res) => res.data);
    };

    this.registroDirector = function (datos) {
      return $http.post(API_URL + '/director/cuenta', datos).then((res) => res.data);
    };
  },
]);
