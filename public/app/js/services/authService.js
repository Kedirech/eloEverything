var app = angular.module("eloEverything")



app.service('authService', function($http, Session, $location){
  this.facebookLogin = function(){
    return $http.get("/auth/facebook")
  }

  this.isAuthenticated = function(){
    return !!Session.userId;
  }

  this.isAuthorized = function (authorizedRoles) {
    if (!angular.isArray(authorizedRoles)) {
      authorizedRoles = [authorizedRoles];
    }
    return (authService.isAuthenticated() &&
      authorizedRoles.indexOf(Session.userRole) !== -1);
  };
})
