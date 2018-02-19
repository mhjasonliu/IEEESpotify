'use strict';

angular.module('frontApp.view2', ['ngRoute','angular-d3-word-cloud'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View2Ctrl', ['$scope','$http','localStorageService', function($scope,$http,localStorageService) {
        var param = getHashParams();
        //give scope its initial values
        $scope.access_token = param.access_token;
        $scope.refresh_token = param.refresh_token;
        $scope.track_data = [];
        if($scope.access_token) {
            localStorageService.set('access_token', $scope.access_token);
            localStorageService.set('refresh_token', $scope.refresh_token);
        }
        localStorageService.bind($scope,'access_token');
        localStorageService.bind($scope,'refresh_token');
        localStorageService.bind($scope,'display_name');
        localStorageService.bind($scope,'userid');
        localStorageService.bind($scope,'tracks');

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

        //for each track in given array, apply get request to get track data from uri
        function extractTrackUriData(tracks){

            tracks.forEach(function(element) {

                var url = "https://api.spotify.com/v1/tracks/" + element.track.uri.substring("spotify:track:".length);

                var track_config={
                    headers:{
                        'Authorization': 'Bearer ' + $scope.access_token
                    }
                };
                $http.get(url,track_config).then(function(response){
                    var InfoObject = {};
                    var trackObj = response.data;
                    InfoObject.redirect="#!/view3#trackuri="+encodeURI(trackObj.uri);
                    InfoObject.uri=trackObj.uri;
                    InfoObject.name = trackObj.name;
                    InfoObject.first_artist = trackObj.artists[0].name;
                    InfoObject.imageurl = trackObj.album.images[0].url;
                    if (InfoObject.name.length > 17){
                        InfoObject.name = InfoObject.name.substr(0, 17) + "...";
                    }
                    if(InfoObject.first_artist.length > 17)
                        InfoObject.first_artist = trackObj.artists[0].name.substr(0,17)+"...";
                    $scope.track_data.push(InfoObject);
                },function(error){
                    console.log("error occured:" +error.toString());

                });
            });
        }

        //slightly faster variant for getting track data as opposed to getting single track
        function extractMultipleTrackUriData(tracks){


            var url = "https://api.spotify.com/v1/tracks/?ids=";
            tracks.forEach(function(element){
                url = url + element.track.uri.substring("spotify:track:".length) + ',';
            });
            url = url.substring(0,url.length-1);

            var track_config={
                headers:{
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };
            console.log("Requesting track data from Spotify");
            console.log(url);
            $http.get(url,track_config).then(function(response){
                var trackObjs = response.data.tracks;
                console.log(trackObjs);
                trackObjs.forEach(function(trackObj){
                    var InfoObject = {};
                    InfoObject.redirect="#!/view3#trackuri="+encodeURI(trackObj.uri);
                    InfoObject.uri=trackObj.uri;
                    InfoObject.name = trackObj.name;
                    if (InfoObject.name.length > 17){
                        InfoObject.name = InfoObject.name.substr(0, 17) + "...";
                    }
                    InfoObject.first_artist = trackObj.artists[0].name;
                    InfoObject.imageurl = trackObj.album.images[0].url;
                    $scope.track_data.push(InfoObject);
                });
            },function(error){
                console.log("error occured:" +error.toString());

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
                        $scope.getUserPlaylists();
                        localStorageService.set('tracks',$scope.tracks);
                    });

                }, function error(response) {
                    console.log("error occured while logging in to spotify");
                });

        };

        //add track from front end to back end.
        $scope.addTrack=function(){
            console.log("requesting add_new_track from front end");

            var url = "https://api.spotify.com/v1/tracks/" + $scope.newTrack.substring("spotify:track:".length);

            var track_config={
                headers:{
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };
            $http.get(url,track_config).then(function(response){

                var data = {
                    username: $scope.display_name,
                    userID: $scope.userid,
                    newTracks: $scope.newTrack
                };

                var config = {};

                $http.post('/add_new_track',data,config)
                    .then(function success(response){
                        $scope.form_feedback = "Track addition successful.";
                        $scope.tracks=response.data.trackList;
                        var newObject = {track:{
                                uri: $scope.newTrack
                            }};
                        extractTrackUriData([newObject]);
                    },function error(response){
                        console.log("error occurred in adding track");
                    });

            },function(error){
                $scope.form_feedback = "Error in obtaining track from Spotify. Input must be valid URI";
                console.log("error occured:" +error.toString());

            });




        };

        //add word from front end to back end
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

        $scope.getUserPlaylists=function(){
          var url = "https://api.spotify.com/v1/me/playlists";
            var config = {

                headers: {
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };

            $http.get(url,config).then(function(response){
                var playlists = response.data;
                var next_url = playlists.items[0].href;
                $scope.all_playlist_data = playlists.items;
                $scope.all_playlist_data.forEach(function(element)
                {
                    if (element.name.length > 17){
                        element.name = element.name.substr(0, 17) + "...";
                    }                       
                });
                console.log($scope.all_playlist_data);
                for(var i = 0; i < $scope.all_playlist_data.length;i++)
                    $scope.all_playlist_data[i].redirect_uri = "#!/view4#playlistid="+encodeURI($scope.all_playlist_data[i].id);
            },function error(response){
                console.log("error occurred in retrieving playlists");
            });

        };

}])


    .controller('AppController', ['$window', '$timeout', function ($window, $timeout) {
    var originWords = [];
    var maxWordCount = 1000;
    var self = this;
    self.content = 'Somebody once told me the world is gonna roll me\n' +
        'I ain\'t the sharpest tool in the shed\n' +
        'She was looking kind of dumb with her finger and her thumb\n' +
        'In the shape of an "L" on her forehead\n' +
        'Well the years start coming and they don\'t stop coming\n' +
        'Fed to the rules and I hit the ground running\n' +
        'Didn\'t make sense not to live for fun\n' +
        'Your brain gets smart but your head gets dumb\n' +
        'So much to do, so much to see\n' +
        'So what\'s wrong with taking the back streets?\n' +
        'You\'ll never know if you don\'t go\n' +
        'You\'ll never shine if you don\'t glow\n' +
        'Hey now, you\'re an all-star, get your game on, go play\n' +
        'Hey now, you\'re a rock star, get the show on, get paid\n' +
        'And all that glitters is gold\n' +
        'Only shooting stars break the mold\n' +
        'It\'s a cool place and they say it gets colder\n';
    self.customColor;
    self.generateWords = generateWords;
    self.padding = 8;
    self.editPadding = 8;
    self.useTooltip = true;
    self.useTransition = true;
    self.wordClicked = wordClicked;
    self.words = [];
    self.random = random;
    generateWords();
    angular.element($window).bind('resize', resizeWordsCloud);
    /**
     * generate words base on some content by split(/\s+/g) and sort descending
     */
    function generateWords() {
        originWords = self.content.split(/\s+/g);
        originWords = originWords.map(function(word) {
            return {
                text: word,
                count: Math.floor(Math.random() * maxWordCount)
            };
        }).sort(function(a, b) {
            return b.count - a.count;
        });
        resizeWordsCloud();
    }
    /**
     * adjust words size base on width
     */
    function resizeWordsCloud() {
        $timeout(function() {
            var element = document.getElementById('wordsCloud');
            var height = $window.innerHeight * 0.75;
            element.style.height = height + 'px';
            var width = element.getBoundingClientRect().width;
            var maxCount = originWords[0].count;
            var minCount = originWords[originWords.length - 1].count;
            var maxWordSize = width * 0.15;
            var minWordSize = maxWordSize / 5;
            var spread = maxCount - minCount;
            if (spread <= 0) spread = 1;
            var step = (maxWordSize - minWordSize) / spread;
            self.words = originWords.map(function(word) {
                return {
                    text: word.text,
                    size: Math.round(maxWordSize - ((maxCount - word.count) * step)),
                    color: self.customColor,
                    tooltipText: word.text + ' tooltip'
                };
            });
            self.width = width;
            self.height = height;
            self.padding = self.editPadding;
            self.rotate = self.editRotate;
        });
    }

    function random() {
        return 0.4; // a constant value here will ensure the word position is fixed upon each page refresh.
    }

    function wordClicked(word) {
        alert('text: ' + word.text + ',size: ' + word.size);
    }
}]);