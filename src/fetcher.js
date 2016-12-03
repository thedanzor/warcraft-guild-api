var getRegion   = require("./utils/get_apiRegion");
var CONFIG      = require("./config");
var request     = require("request");

module.exports = function (guild, done) {
	var api = getRegion(guild.region);
	var url = api +
		'/wow/guild/' +
		guild.realm + '/' + guild.name +
		'?fields=members&locale=en_GB&apikey=' +
		CONFIG.blizzardKey;

		console.log('guild member url', url);

	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var guildObject = {}
			var data = JSON.parse(body);

			guildObject.name = guild.name;
			guildObject.realm = guild.realm;
			guildObject.region = guild.region;
			guildObject.roster = [];

			var i = 0;
			var responses = 0;
			var processed = 0;
			for (i; i < data.members.length; i++) {
				// Only filter through certain levels
				if (data.members[i].character.level >= CONFIG.level) {
					// We keep keep track of the number of members we are processing.
					processed++

					// Build API URL for the member
					var memberUrl = api + '/wow/character/' +
						data.members[i].character.realm + '/' +
						data.members[i].character.name + '?fields=items&locale=en_GB&apikey=' +
						CONFIG.blizzardKey;

					console.log(memberUrl)

					// Request the characters data
					request(memberUrl, function (error, response, body) {
						console.log(error, response, body)
						// We track the number of responses we get
						responses++;

						// If the response is an error or empty, escape.
						if (error || !response || !body) {
							return;
						}

						var char = JSON.parse(body);

						if (char.status === 'nok') {
							return;
						}

						// Lets start stripping some data
						var items = {
							"itemLevelEquiped" : char.items.averageItemLevelEquipped,
							"itemLevelOverall" : char.items.averageItemLevel
						};

						char.items = items;

						// Lets push this new character to our roster array
						guildObject.roster.push(char);

						// If we have all the member data, return the object for storing
						console.log(responses, processed);
						if (responses === processed) {
							console.log(guildObject.roster);
							done(guildObject);
						}
					});
				}
			}
		}
	});
};
