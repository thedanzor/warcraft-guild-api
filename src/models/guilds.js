var mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/wow_api');

var mongoSchema = mongoose.Schema;
var schema  = {
	"name" : String,
	"realm" : String,
	"region" : String,
	"roster" : Array,
	"events" : Array,
	"teams" : Array
};

module.exports = mongoose.model('guilds', schema);
