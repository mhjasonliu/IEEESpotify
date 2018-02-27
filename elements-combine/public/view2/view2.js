'use strict';


angular.module('frontApp.view2', ['ngRoute', 'angular-d3-word-cloud'])

    .config(['$routeProvider', function ($routeProvider) {
    }])

    .controller('AppController', ['$scope', '$http', 'localStorageService', '$window', '$timeout', function ($scope, $http, localStorageService,$window,$timeout) {
        var param = getHashParams();


        //give scope its initial values
        $scope.access_token = param.access_token;
        $scope.refresh_token = param.refresh_token;
        $scope.track_data = [];
        $scope.playlist_builder = [];
        $scope.all_playlist_data = [];
        $scope.offset = 0;
        if ($scope.access_token) {
            localStorageService.set('access_token', $scope.access_token);
            localStorageService.set('refresh_token', $scope.refresh_token);
        }

        localStorageService.bind($scope, 'access_token');
        localStorageService.bind($scope, 'refresh_token');
        localStorageService.bind($scope, 'display_name');
        localStorageService.bind($scope, 'userid');
        localStorageService.bind($scope, 'tracks');
        localStorageService.bind($scope, 'wordsMap');



        $scope.$on('word_clicked',function(event,arg){
            console.log("red alert");
            if(arg && !$scope.playlist_builder.includes(arg))
                $scope.playlist_builder.push(arg);
            console.log($scope.playlist_builder);
            $scope.$apply();
        });

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
        function extractTrackUriData(tracks) {

            tracks.forEach(function (element) {

                var url = "https://api.spotify.com/v1/tracks/" + element.track.uri.substring("spotify:track:".length);

                var track_config = {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.access_token
                    }
                };
                $http.get(url, track_config).then(function (response) {
                    var InfoObject = {};
                    var trackObj = response.data;
                    InfoObject.redirect = "#!/view3#trackuri=" + encodeURI(trackObj.uri);
                    InfoObject.uri = trackObj.uri;
                    InfoObject.name = trackObj.name;
                    InfoObject.first_artist = trackObj.artists[0].name;
                    InfoObject.imageurl = trackObj.album.images[0].url;
                    if (InfoObject.name.length > 21){
                        InfoObject.name = InfoObject.name.substr(0, 21) + "...";
                    }
                    if(InfoObject.first_artist.length > 21)
                        InfoObject.first_artist = trackObj.artists[0].name.substr(0,21)+"...";
                    InfoObject.isHidden = false;
                    $scope.track_data.push(InfoObject);
                    localStorageService.set('track_data',$scope.track_data);
                },function(error){
                    console.log("error occured:" +error.toString());

                });
            });
        }


        $scope.databaseLogin = function () {
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
                        $scope.wordsMap = response.data.wordsMap;
                        extractTrackUriData($scope.tracks);
                        $scope.startWordCloud();
                        $scope.getUserPlaylists();
                        localStorageService.set('tracks',$scope.tracks);
                    });

                }, function error(response) {
                    console.log("error occured while logging in to spotify");
                });

        };

        //add track from front end to back end.
        $scope.addTrack = function () {
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
                        if($scope.tracks == response.data.tracklist){
                            console.log("Track is already in database. Continuing execution");
                            return;
                        }
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
        $scope.addWord = function () {
            console.log("requesting to add new word from front end");
            var data = {
                username: $scope.display_name,
                userID: $scope.userid,
                current_track_uri: $scope.newTrack,
                new_word: $scope.newWord
            };

            var config = {};
            $http.post('/associate_word', data, config)
                .then(function success(response) {
                    $scope.tracks = response.data.trackList;
                }, function error(response) {
                    console.log("error occurred in associating word");
                });
        };

        $scope.getUserPlaylists = function () {
            var url = "https://api.spotify.com/v1/me/playlists";
            var config = {

                headers: {
                    'Authorization': 'Bearer ' + $scope.access_token
                },
                params:{
                    offset: $scope.offset
                }

            };

            $scope.offset += 20;

            $http.get(url, config).then(function (response) {
                var playlists = response.data;
                $scope.all_playlist_data=$scope.all_playlist_data.concat(playlists.items);
                $scope.all_playlist_data.forEach(function(element)
                {
                    if (element.name.length > 18){
                        element.name = element.name.substr(0, 18) + "...";
                    }                       
                });
                console.log($scope.all_playlist_data);
                for(var i = 0; i < $scope.all_playlist_data.length;i++)
                    $scope.all_playlist_data[i].redirect_uri = "#!/view4#playlistid="+encodeURI($scope.all_playlist_data[i].id);
            },function error(response){
                console.log("error occurred in retrieving playlists");
            });

        };

        $scope.searchForWord = function(word){
            $scope.track_data.forEach(function(track_data_element){
               var particular_track = $scope.tracks.find(function(elt){
                   return track_data_element.uri === elt.track.uri;
               });
               var strings_compressed = particular_track.listOfStrings.join(" ");
               track_data_element.isHidden = !((new RegExp(word,'i')).test(strings_compressed));
            });

            console.log($scope.track_data);
        };

/********************************************************************************************************************/


//this is wordcloud stuff
        var originWords = [];
        var maxWordCount = 1000;
        var self = this;
        this.content = '';
        this.customColor;
        this.generateWords = generateWords;
        this.padding = 8;
        this.editPadding = 8;
        this.useTooltip = true;
        this.useTransition = true;
        this.wordClicked = wordClicked;
        this.words = [];
        this.random = random;
        //generateWords();
        angular.element($window).bind('resize', resizeWordsCloud);

        $scope.startWordCloud = function () {
            console.log("generating a word cloud");
            var data = {
                username: $scope.display_name

            };
            var config = {};

            $http.post('/word_cloud', data, config)
                .then(function success(response) {
                    self.content = response.data.text;
                    $scope.wordsMap = response.data.wordsMap;
                    //console.log(self.content);

                    generateWords();

                }, function error(response) {
                    console.log("error when loading the word cloud");
                });
        }

        function getFrequencyArray(wordsArray){
            var wordsMap = {};
            /*
              wordsMap = {
                'Oh': 2,
                'Feelin': 1,
                ...
              }
            */
            wordsArray.forEach(function (key) {
                if (wordsMap.hasOwnProperty(key)) {
                    wordsMap[key]++;
                } else {
                    wordsMap[key] = 1;
                }
            });

            return wordsMap;
        }

        function generateWords() {
            console.log("Displaying words onto the word cloud");
            var wordsMap = $scope.wordsMap;
            console.log(wordsMap);
            originWords = Object.keys(wordsMap).map(function (key) {
                return {
                    text: key,
                    count: Math.min(wordsMap[key],maxWordCount)
                    //count: Math.floor(Math.random() * maxWordCount)
                };
            }).sort(function (a, b) {
                return b.count - a.count;
            });
            resizeWordsCloud();
        }
        function resizeWordsCloud() {
            $timeout(function () {
                var element = document.getElementById('wordsCloud');
                var height = $window.innerHeight * 0.7;
                element.style.height = height + 'px';
                var width = $window.innerWidth;
                var maxCount, minCount;
                if(originWords[0]) {
                    maxCount = originWords[0].count;
                    minCount = originWords[originWords.length - 1].count;
                }
                var maxWordSize = width * 0.15;
                var minWordSize = maxWordSize / 5;
                var spread = maxCount - minCount;
                if (spread <= 0) spread = 1;
                var step = (maxWordSize - minWordSize) / spread;
                self.words = originWords.map(function (word) {
                    return {
                        text: word.text,
                        //size: Math.round(maxWordSize - ((maxCount - word.count) * step)),
                        size: Math.round(maxWordSize - ((maxCount - word.count) * step)),
                        color: "rgba(9, 138, 130," + Math.min(Math.max(word.count / maxCount, .3), 1) + ")",
                        tooltipText: word.count
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
            var index = $scope.tracks.findIndex(function(element){
                var strings_compressed = element.listOfStrings.join(' ');
                return (new RegExp(word.text,'i')).test(strings_compressed);
            });
            //alert('text: ' + word.text + ',size: ' + word.size);

            var newThing = $scope.track_data[index];
            $scope.wordQuery = word.text;
            $scope.searchForWord($scope.wordQuery);
            if(!$scope.playlist_builder.includes(newThing))
                $scope.playlist_builder.push(newThing);
            $scope.$apply();

            console.log($scope.playlist_builder);
        }


}]);




