angular.module('frontApp',['ngRoute'])
    .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {


        $locationProvider.html5Mode(true);
}]);