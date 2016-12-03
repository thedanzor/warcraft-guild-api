var getRegion   = require("./get_apiRegion");
var CONFIG      = require("../config");
var request     = require("request");

module.exports = function (guild, done) {
	var api = getRegion(guild.region);
	var url = api +
		'/wow/guild/' +
		guild.realm + '/' + guild.name +
		'?locale=en_GB&apikey=' +
		CONFIG.blizzardKey;

	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			body = JSON.parse(body);
			done(body);
		} else {
			done(false);
		}
	})
};
