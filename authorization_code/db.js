var mongoose = require('mongoose');
var hasher = require('./hasher');

var username = "ieeejasonliu";
var pword = "kappa123";
var uri = "mongodb://"+username+":"+pword+"@ds121896.mlab.com:21896/ieeespotify";

var Schema = mongoose.Schema;

var trackSchema = new Schema({
    track: Object,
    listOfStrings: [String]
});

var dbEntrySchema = new Schema({
    username: String,
    userID: String,
    salt: String,
    listOfTracks: [trackSchema]
});
var DBEntry = mongoose.model('DBEntry',dbEntrySchema);

function addNewEntry(newusername,newuserID) {
    var newEntry = new DBEntry();
    newEntry.username = newusername;
    newEntry.userID = newuserID;
    newEntry.salt = hasher.genString(16);
    newEntry.listOfTracks = [];
    newEntry.save(function(err){
        if(err) return console.log(err);
    });
    return newEntry;
}

module.exports = {
    uri: uri,
    addNewEntry: addNewEntry,
    DBEntry: DBEntry
};