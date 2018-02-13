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

        function extractTrackUriData(tracks){
            $scope.track_data = [];
            tracks.forEach(function(element) {

                var url = "https://api.spotify.com/v1/tracks/" + element.track.uri.substring("spotify:track:".length);
                console.log(url);

                var track_config={
                    headers:{
                        'Authorization': 'Bearer ' + $scope.access_token
                    }
                };
                $http.get(url,track_config).then(function(response){
                    var InfoObject = {};
                    console.log(response.data);
                    console.log(response.data.album.images[0].url);
                    InfoObject.name = response.data.name;
                    InfoObject.first_artist = response.data.artists[0].name;
                    InfoObject.imageurl = response.data.album.images[0].url;
                    $scope.track_data.push(InfoObject);
                },function(error){
                    console.log("error occured:" +error);
                });
            });
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
                        extractTrackUriData($scope.tracks);
                    });

                }, function error(response) {
                    console.log("error occured while logging in to spotify");
                });

        };

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
                    extractTrackUriData($scope.tracks);
                });
        };

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
        };

}]);