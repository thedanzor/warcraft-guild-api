var getRegion   = require("./utils/get_apiRegion");
var CONFIG      = require("./config");
var request     = require("request");

var update = function (guildConfig, payload, done) {
	if (!guildConfig || !payload || !done) {
		return;
	}
};

var Add = function (guildConfig, payload, done) {
	if (!guildConfig || !payload || !done) {
		return;
	}
};

module.exports = {
	update: Update,
	add, Add
};
