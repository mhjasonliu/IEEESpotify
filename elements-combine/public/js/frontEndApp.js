angular.module('frontApp',['ngRoute',
                           'LocalStorageModule',
                           'frontApp.view1',
                           'frontApp.view2',
                           'frontApp.view3',
                           'frontApp.view4'])
    .config(['$locationProvider', '$routeProvider','localStorageServiceProvider',
        function($locationProvider, $routeProvider,localStorageServiceProvider) {

        localStorageServiceProvider.setPrefix('frontApp');

        $locationProvider.hashPrefix('!');

        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        }).when('/view2', {
            templateUrl: 'view2/view2.html',
            controller: 'AppController'
        }).when('/view3', {
            templateUrl: 'view3/view3.html',
            controller: 'View3Ctrl'
        }).when('/view4', {
            templateUrl: 'view4/view4.html',
            controller: 'View4Ctrl'
        }).otherwise({redirectTo: '/view1'});
        console.log("finished config");
    }])
    .controller('mainCtrl',['$scope','localStorageService',function($scope,localStorageService){

    }]);

