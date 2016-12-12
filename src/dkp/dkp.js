module.exports = function(dbguild, guildConfig, body, roster, done) {
	var payload = body.action.payload;

	if (payload && payload.length) {
		for (var i = 0; i < payload.length; i++) {

			switch (payload[i].action) {
				case 'add':
					roster[payload[i].name].dkp = roster[payload[i].name].dkp + payload[i].value;
					break;
				case 'minus':
					roster[payload[i].name].dkp = roster[payload[i].name].dkp - payload[i].value;
					break;
				case 'set':
					roster[payload[i].name].dkp = payload[i].value;
					break;
				default:
					return;
			}

			if (i === payload.length - 1) {
				var guildUpdate = {
					"roster": roster
				}

				dbguild.update(guildConfig, guildUpdate, { upsert: false }, function (err, data) {
					if (!err) {
						done("Updated Roster");
					} else {
						done("ERROR: " + err);
					}
				});
			}
		}
	}
};
