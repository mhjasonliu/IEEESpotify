'use strict';

angular.module('frontApp.view3', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View3Ctrl', ['$scope','localStorageService',function($scope,localStorageService) {

        localStorageService.bind($scope,'access_token');
        localStorageService.bind($scope,'refresh_token');

    }]);