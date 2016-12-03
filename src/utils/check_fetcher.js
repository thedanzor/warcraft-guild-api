var inprocess = [];

var format = function (guild) {
	return guild.name + '-' +
		guild.realm + '-' +
		guild.region;
};

module.exports = function (guild, update) {
	var data = format(guild);
	var inArray = inprocess.indexOf(data);

	if (update && inArray >= 0) {
		inprocess.splice(inArray, 1);
		return false;
	}

	if (inArray >= 0) {
		return true;
	}

	inprocess.push(data);
	return false;
};
