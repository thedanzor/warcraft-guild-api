module.exports = function (region) {
	if (region === 'eu') {
		return "https://eu.api.battle.net";
	} else {
		return "https://us.api.battle.net";
	}
};
