angular.module('frontApp',['ngRoute',
                           'frontApp.view1',
                           'frontApp.view2',
                           'frontApp.view3'])
    .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
<<<<<<< HEAD

        $locationProvider.html5Mode(true);
}]);
=======
        
        $locationProvider.hashPrefix('!');
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        }).when('/view2', {
            templateUrl: 'view2/view2.html',
            controller: 'View2Ctrl'
        }).when('/view3', {
            templateUrl: 'view3/view3.html',
            controller: 'View3Ctrl'
        }).otherwise({redirectTo: '/view1'})
        console.log("finished config");
        
}])
;
>>>>>>> 2f7ec2fd42620c46362c32d81c174495dbfb9714
