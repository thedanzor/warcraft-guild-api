module.exports = function (data) {

	if (data && data.message && data.message == '' || data.length === 0) {
		return false;
	}

	return true;
};
