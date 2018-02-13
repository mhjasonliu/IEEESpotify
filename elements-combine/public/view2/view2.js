'use strict';

angular.module('frontApp.view2', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View2Ctrl', ['$scope','$http','localStorageService', function($scope,$http,localStorageService) {
        var param = getHashParams();
        $scope.access_token = param.access_token;
        $scope.refresh_token = param.refresh_token;
        if($scope.access_token) {
            localStorageService.set('access_token', $scope.access_token);
            localStorageService.set('refresh_token', $scope.refresh_token);
        }
        localStorageService.bind($scope,'access_token');
        localStorageService.bind($scope,'refresh_token');

        function getHashParams() {
            var hashParams = {};
            const urllen = "#!/view2#".length;
            var e, r = /([^&;=]+)=?([^&;]*)/g,
                q = window.location.hash.substring(urllen);

            while (e = r.exec(q)) {
                hashParams[e[1]] = decodeURIComponent(e[2]);
            }
            return hashParams;
        }


        $scope.databaseLogin = function(){
            var config = {
                headers: {
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };

            console.log("Attempting to retrieve user info from spotify");
            $http.get('https://api.spotify.com/v1/me', config)
                .then(function success(response) {
                    $scope.display_name = response.data.display_name;
                    $scope.userid = response.data.id;

                    console.log("Attempting to log into database");

                    var dbconfig = {
                        params: {
                            'username': $scope.display_name,
                            'userID': $scope.userid
                        }
                    };

                    $http.get("/dblogin", dbconfig).then(function (response) {
                        $scope.tracks = response.data.trackList;
                    });

                }, function error(response) {
                    console.log("error occured while logging in to spotify");
                });

        }

        $scope.addTrack=function(){
            console.log("requesting add_new_track from front end");
            var data = {
                username: $scope.display_name,
                userID: $scope.userid,
                newTracks: $scope.newTrack
            };

            var config = {};

            $http.post('/add_new_track',data,config)
                .then(function success(response){
                    $scope.tracks=response.data.trackList;
                },function error(response){
                    console.log("error occurred in adding track");
                });
        }

        $scope.addWord=function(){
            console.log("requesting to add new word from front end");
            var data = {
                username: $scope.display_name,
                userID: $scope.userid,
                current_track_uri: $scope.newTrack,
                new_word: $scope.newWord
            };

            var config = {};
            $http.post('/associate_word',data,config)
                .then(function success(response){
                    $scope.tracks=response.data.trackList;
                },function error(response){
                    console.log("error occurred in associating word");
                });
        }
        $scope.tracklist = ["song1", "song2", "song3", "song4"];

}]);