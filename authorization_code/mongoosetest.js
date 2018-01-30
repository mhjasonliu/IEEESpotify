var mongoose = require('mongoose');
var username = "ieeejasonliu";
var pword = "kappa123";

var uri = "mongodb://"+username+":"+pword+"@ds121896.mlab.com:21896/ieeespotify";

mongoose.connect(uri);

var db = mongoose.connection;
db.on('error', console.error.bind(console,'connection error:'));
db.once('open', function() {
    console.log('we are connected!');
});

var mySchema = mongoose.Schema({
    name: String
});

mySchema.methods.speak = function() {
    console.log('Im not your buddy, guy.');
}

var Buddy = mongoose.model('Buddy',mySchema);

var guy = new Buddy({name: 'not your buddy guy'});
Buddy.find({name: 'not your buddy guy'}).remove().exec();

guy.save(function (err, guy) {
    if(err) return console.error(err);
    guy.speak();
});

Buddy.find(function(err,buddies) {
    if(err) console.log(err);
    console.log(buddies);

});
