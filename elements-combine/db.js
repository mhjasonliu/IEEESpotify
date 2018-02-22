var mongoose = require('mongoose');
var hasher = require('./hasher');

var username = "ieeejasonliu";
var pword = "kappa123";
var uri = "mongodb://"+username+":"+pword+"@ds121896.mlab.com:21896/ieeespotify";

var Schema = mongoose.Schema;

var trackSchema = new Schema({
    track: Object,
    listOfStrings: [String],
    metaData: [String]
});

var dbEntrySchema = new Schema({
    username: String,
    userID: String,
    salt: String,
    listOfTracks: [trackSchema],
    wordsMap: Object
});
var DBEntry = mongoose.model('DBEntry',dbEntrySchema);

var addNewEntry = function(newusername,newuserID) {
    var newEntry = new DBEntry();
    newEntry.username = newusername;
    newEntry.userID = newuserID;
    newEntry.salt = hasher.genString(16);
    newEntry.listOfTracks = [];
    newEntry.wordsMap = {};
    newEntry.save(function(err){
        if(err) return console.log(err);
    });
    return newEntry;
}

function getWordsArray(listOfTracks){
    var len = listOfTracks.length;
    var wordsArray = [];
    var text = "";
    for (var i = 0; i < len; i++){
        var track = listOfTracks[i];
        for (var j = 0; j < track.listOfStrings.length; j++){
            var result = track.listOfStrings[j].replace(/[^a-zA-Z0-9]/g, " ").toLowerCase();
            text += result + " ";
        }
    }
    wordsArray = text.split(/\s+/g);
    //console.log(wordsArray);
    return wordsArray;
}

function getWordsMap(wordsArray){
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

    console.log(wordsMap);
    return wordsMap;
}

module.exports = {
    uri: uri,
    setup: function(app) {
        app.get('/dblogin', function(req,res){
            var userlogin = req.query.username;
            var userID = req.query.userID;

            console.log("received userlogin info: " + userlogin);
            DBEntry.find({username: userlogin, userID: userID}, function(err, doc) {
                if(err) return console.log(err);
                if(doc.length == 0) {
                    console.log("user does not currently exist. attempting to create");
                    var newEntry = addNewEntry(userlogin,userID);
                    res.send({
                        'trackList' : newEntry.listOfTracks
                    });
                }
                else {
                    console.log("user found");
                    res.send({
                        'trackList' : doc[0].listOfTracks,
                        'wordsMap': doc[0].wordsMap
                    });
                }
            });


        });

        app.post('/add_new_track', function(req,res){

            var newTracks = req.body.newTracks;
            var userlogin = req.body.username;
            var userID = req.body.userID;

            console.log(req.url);
            console.log("Attempting to add track");
            console.log(newTracks,userlogin,userID);

            DBEntry.findOne({username:userlogin, userID: userID},function(err, doc){
                if(err) return console.log(err);

                if(doc === null) {
                    res.send({
                        'err': ["You must be logged in to access."]
                    });
                    return;
                }

                if(!Array.isArray(newTracks)) {
                    newTracks = [newTracks];
                }
                newTracks.forEach(function(newItem){
                    var trackObj = {};
                    trackObj.uri = newItem;

                    if (doc.listOfTracks.find(function (x) {
                            return x.track.uri === newItem
                        }) === undefined)
                        doc.listOfTracks.push({track: trackObj, listOfStrings: [], metaData: []});
                });

                doc.save(function(err){
                    if(err) return console.log(err);
                    console.log("update successful");
                });
                res.send({
                    'trackList': doc.listOfTracks,
                    'wordsMap': doc.wordsMap
                });
            });

        });

        app.post('/word_cloud', function(req,res){
            var userlogin = req.body.username;
            var userID = req.body.userID;
            console.log(userlogin);
            

            var text = "";

            DBEntry.find({username: userlogin}, function(err, doc){
                if(err) return console.log(err);

                if(doc === null) {
                    return console.log("No contents found");
                }

                /*  Old Code for Word map
                var len = doc[0].listOfTracks.length;
                for (var i = 0; i < len; i++){
                    var track = doc[0].listOfTracks[i];
                    for (var j = 0; j < track.listOfStrings.length; j++){
                        var result = track.listOfStrings[j].replace(/[^a-zA-Z0-9]/g, " ");
                        text = text +" " + result.toLowerCase();
                    }
                }
                */

                console.log(text);

                res.send({
                    'wordsMap': doc[0].wordsMap
                });
            });

        });

        app.post('/associate_word',function(req,res){
            var userlogin = req.body.username,
                userID = req.body.userID,
                trackuri = req.body.current_track_uri,
                new_word = req.body.new_word;

            var right_now = new Date();

            console.log("Attempting to associate word");
            console.log(userlogin,userID,trackuri,new_word);

            DBEntry.findOne({username:userlogin, userID: userID},function(err, doc){
                if(err) return console.log(err);

                if(doc === null) {
                    res.send({
                        'err': "You must be logged in to access."
                    });
                    return;
                }

                var idx = doc.listOfTracks.findIndex(function(element) {
                    //console.log(element.track.uri + " " + trackuri);
                    return element.track.uri == trackuri});
                if(idx != -1) {
                    if (doc.listOfTracks[idx].listOfStrings.find(function (x) {
                            return new_word === x;
                        }) === undefined) {

                        doc.listOfTracks[idx].listOfStrings.push(new_word);
                        doc.listOfTracks[idx].metaData.push(right_now.toString());
                    }
                }
                else {

                    var trackObj = {};
                    trackObj.uri = trackuri;
                    var listOfStrings = [];
                    listOfStrings.push(new_word);

                    doc.listOfTracks.push({track: trackObj, listOfStrings: listOfStrings, metaData: [right_now.toString()]});
                }

                //update the words map
                doc.wordsMap = getWordsMap(getWordsArray(doc.listOfTracks));

                doc.save(function(err){
                    if(err)
                        return console.log(err);
                    else
                        console.log("update successful");
                });
                res.send({
                    'trackList': doc.listOfTracks,
                    'current_time': right_now.toString(),
                    'wordsMap': doc.wordsMap
                });
            });

        });

        app.post('/remove_track',function(req,res){
            var userlogin = req.body.username,
                userID = req.body.userID,
                trackuri = req.body.current_track_uri;

            console.log("Attempting to remove track.");
            console.log(userlogin,userID,trackuri);

            DBEntry.findOne({username:userlogin, userID: userID},function(err, doc){
                if(err) return console.log(err);

                if(doc === null) {
                    res.send({
                        'err': "You must be logged in to access."
                    });
                    return;
                }

                var idx = doc.listOfTracks.findIndex(function(element) {
                    return element.track.uri === trackuri});
                if(idx != -1) {
                    doc.listOfTracks.splice(idx, 1); //remove 1 item from the i'th index
                }

                doc.wordsMap = getWordsMap(getWordsArray(doc.listOfTracks));

                doc.save(function(err){
                    if(err)
                        return console.log(err);
                    else
                        console.log("removal successful");
                });
                res.send({
                    'trackList': doc.listOfTracks,
                    'wordsMap': doc.wordsMap
                });
            });

        });

        app.post('/remove_word',function(req,res){
            var userlogin = req.body.username,
                userID = req.body.userID,
                trackuri = req.body.current_track_uri,
                current_word = req.body.current_word;

            console.log("Attempting to remove word from a track");
            console.log(userlogin,userID,trackuri,current_word);

            DBEntry.findOne({username:userlogin,userID:userID},function(err, doc){
                if(err) return console.log(err);

                if(doc === null) {
                    res.send({
                        'err': "You must be logged in to access."
                    });
                    return;
                }

                var idx = doc.listOfTracks.findIndex(function(element) {
                    return element.track.uri === trackuri});
                if(idx != -1) {
                    var string_idx = doc.listOfTracks[idx].listOfStrings.indexOf(current_word);
                    if(string_idx != -1) {
                        doc.listOfTracks[idx].listOfStrings.splice(string_idx, 1);    //remove 1 element from ith index
                        doc.listOfTracks[idx].metaData.splice(string_idx,1);
                    }
                }

                //update the words map
                doc.wordsMap = getWordsMap(getWordsArray(doc.listOfTracks));

                doc.save(function(err){
                    if(err)
                        return console.log(err);
                    else
                        console.log("removal successful");
                });
                res.send({
                    'trackList': doc.listOfTracks,
                    'wordsMap': doc.wordsMap
                });

            });


        });


    }
};