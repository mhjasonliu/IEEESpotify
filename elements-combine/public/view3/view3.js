'use strict';

angular.module('frontApp.view3', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View3Ctrl', ['$scope','$http','localStorageService',function($scope,$http,localStorageService) {

        var param = getHashParams();
        $scope.current_track_strings = [];
        //bind current values to values in local storage
        localStorageService.bind($scope,'display_name');
        localStorageService.bind($scope,'userid');
        localStorageService.bind($scope,'access_token');
        localStorageService.bind($scope,'refresh_token');
        localStorageService.bind($scope,'tracks');
        //use local storage to do computations
        findTrackData();

        function getHashParams() {
            var hashParams = {};
            const urllen = "#!/view3#".length;
            var e, r = /([^&;=]+)=?([^&;]*)/g,
                q = window.location.hash.substring(urllen);

            while (e = r.exec(q)) {
                hashParams[e[1]] = decodeURIComponent(e[2]);
            }
            return hashParams;
        }

        function findTrackData(){
            var trackUri = param.trackuri;
            console.log(trackUri);
            var url = "https://api.spotify.com/v1/tracks/" + trackUri.substring("spotify:track:".length);

            var track_config= {
                headers:{
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };

            $http.get(url,track_config).then(function(response){
                var InfoObject = {};
                console.log(response.data);
                InfoObject.uri=response.data.uri;
                InfoObject.name = response.data.name;
                InfoObject.first_artist = response.data.artists[0].name;
                InfoObject.imageurl = response.data.album.images[0].url;
                $scope.current_track = InfoObject;
            },function(error){
                console.log("error occured:" +error);
            });
            //get the current track's strings. These should be from the binding in the local storage
            $scope.current_track_strings = getTrackStrings();
        }

        function getTrackStrings(){
            var currentUri = param.trackuri;

            return $scope.tracks.find(function(x){
                return x.track.uri == currentUri;
            }).listOfStrings;
        }

        $scope.setNewWord = function(newString){
            if(!newString)
                return;
            console.log("Submitting new word: " + newString);
            console.log("requesting to add new word from front end to back end");
            var data = {
                username: $scope.display_name,
                userID: $scope.userid,
                current_track_uri: $scope.current_track.uri,
                new_word: newString
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