var getRegion   = require("./utils/get_apiRegion");
var CONFIG      = require("./config");
var request     = require("request");

var api;
var guild;

var buildCharacterUrl = function (charData) {
	// Build API URL for the member
	var url = api + '/wow/character/' +
		charData.realm + '/' +
		charData.name + '?fields=items&locale=en_GB&apikey=' +
		CONFIG.blizzardKey;
	return url;
};

var Character = function (url, done) {
	// Request the character s data
	request(url, function (error, response, body) {
		// If the response is an error or empty, escape.
		if (error || !body) {
			done(null);
		} else {
			var char = JSON.parse(body);

			if (char.status === 'nok') {
				done(null);
			} else {
				console.log('COLLECTED CHARACTER, ', char.name);
				// Lets start stripping some data
				var items = {
					"itemLevelEquiped" : char.items.averageItemLevelEquipped,
					"itemLevelOverall" : char.items.averageItemLevel
				};

				char.dkp = 0;

				char.items = items;
				done(char);
			}
		}
	});
};

var processRoster = function (roster, done) {
	var length = roster.length;
	var newRoster = {};
	var iterations = 0;

	if (!roster || !length || !done) {
		done(null);
	}

	function processMember (character) {
		iterations++

		if (!character  || !character.character) {
			done(newRoster);
		} else {
			var character = character.character;

			if (character.level !== CONFIG.level) {
				processMember(roster[iterations]);
			} else {
				var memberUrl = buildCharacterUrl(character);

				Character(memberUrl, function (newChar) {
					if (newChar) {
						newRoster[newChar.name] = newChar;
					}

					processMember(roster[iterations]);
				});
			}
		}
	};

	processMember(roster[iterations])
};

var Guild = function (url, done) {
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var guildObject = {}
			var data = JSON.parse(body);

			guildObject.name = data.name;
			guildObject.realm = data.realm;
			guildObject.region = data.region;
			guildObject.roster = data.members;

			done(guildObject);
		}
	});
};

module.exports = function (guild, done) {
	guild = guild;
	api = getRegion(guild.region);
	var url = api +
		'/wow/guild/' +
		guild.realm + '/' + guild.name +
		'?fields=members&locale=en_GB&apikey=' +
		CONFIG.blizzardKey;

	Guild(url, function (guildData) {
		if (!guildData) {
			return;
		}

		processRoster(guildData.roster, function(roster) {
			if (!roster) {
				done(null);
			}

			guildData.roster = roster;
			done(guildData);
		});
	});
};
