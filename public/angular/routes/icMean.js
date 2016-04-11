'use strict';


/**
 *
 */
var checkUserIsLoggedOrNot = function($q, $timeout, $http, $location, $rootScope, status) {

    // Initialize a new promise
    var deferred = $q.defer();

    // Make an AJAX call to check if the user is logged in
    $http.get('/users/me').success(function(user) {

        $rootScope.loggedUser = user;
        
        if(user == null || user == 'null') {
            user = false;
        }
        
        // Authenticated
        if (status && !user) {
            $timeout(deferred.reject);
            setTimeout(function(){
                window.location = '#!login';
            },100);
            return;
        }

        // 
        if (!status && user) {
            $timeout(deferred.reject);
             window.location = '#!/login';
        }
        
    }).error(function() {
        $timeout(deferred.reject);
    });

    $timeout(deferred.reject);

    return deferred.promise;
}

// --
// Generate guid for QR code 
var guid = (function() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
      }
      return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
               s4() + '-' + s4() + s4() + s4();
      };
})();

// Check if the user is logged in
var checkLoggedIn = function($q, $timeout, $http, $location, $rootScope) {
    checkUserIsLoggedOrNot($q, $timeout, $http, $location, $rootScope, true);
};

// Check if the user is logged in
var checkLoggedOut = function($q, $timeout, $http, $location, $rootScope) {
    checkUserIsLoggedOrNot($q, $timeout, $http, $location, $rootScope, false);
};

var dbMfgModule = angular.module('Mfg', ['ngCookies','ngResource', 'ui.bootstrap','ui.router','toastr', 'ngAnimate']);


dbMfgModule.config(['$stateProvider', '$urlRouterProvider', '$locationProvider',

    function($stateProvider, $urlRouterProvider, $locationProvider) {

        $locationProvider.html5Mode({ enabled: false, requireBase: true }).hashPrefix('!');

        $stateProvider.state('ic-signup', {
            url: '/signup',
            templateUrl: '/angular/views/users/signup.html',
            resolve: {
                loggedin: checkLoggedOut
            }
        });

        $stateProvider.state('login', {
            url: '/login',
            templateUrl: 'angular/views/users/login.html',
            resolve: {
                loggedin: checkLoggedOut
            }
        });

        $stateProvider.state('forgot-password', {
            url: '/forgot-password',
            templateUrl: '/angular/views/users/forgot-password.html',
            resolve: {
                loggedin: checkLoggedOut
            }
        });

        $stateProvider.state('my-profile', {
            url: '/profile',
            templateUrl: '/angular/views/users/profile-edit.html',
            resolve: {
                loggedin: checkLoggedIn
            }
        });

        $stateProvider.state('change-password', {
            url: '/change-password',
            templateUrl: '/angular/views/users/change-password.html',
            resolve: {
                loggedin: checkLoggedIn
            }
        });


        $stateProvider.state('dashboard', {
            url: '/dashboard',
            templateUrl: '/angular/views/dashboard.html',
            resolve: {
                loggedin: checkLoggedIn
            }
        });

        $stateProvider.state('reset-password', {
            url: '/reset/:token',
            templateUrl: '/angular/views/users/reset-password.html'
        });

        $urlRouterProvider.otherwise('/dashboard');

    }
]);

angular.element(document).ready(function() {
    if (window.location.hash === '#_=_') window.location.hash = '#!';
    angular.bootstrap(document, ['Mfg']);
});