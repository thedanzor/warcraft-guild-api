var express     =   require("express");
var PORT        =   3000;
var app         =   express();
var bodyParser  =   require("body-parser");
var dbguild     =   require("./models/guilds");
var router      =   express.Router();

// Utilities
var validateData = require("./utils/validate_response");
var getGuild     = require("./utils/validate_guild");
var fecther      = require("./fetcher");
var inprocess    = require("./utils/check_fetcher");

// Globals
var guild;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

router.get("/",function(req,res){
	res.json({"error" : false, "response" : "invalid request"});
});

// If the user is requesting guild information
router.route("/view")
	.get( function (req, res) {
		var response = {};

		res.json({"error" : true, "response" : "Invalid request"});
	});

router.route("/view/:name/:realm/:region")
	.get( function (req, res) {
		var response = {};
		var guildConfig = {
			"name": req.params.name,
			"realm": req.params.realm,
			"region": req.params.region
		};

		console.log(guildConfig);

		dbguild.find(guildConfig, function(err, data) {
			if (err || !data) {
				res.json({"error" : true, "message" : "Error fetching data", "code": 0});
			} else if (validateData(data)) {
				res.json({"error" : false, "message" : data, "code": 1});
			} else {
				guild = getGuild(guildConfig, function (response) {
					if (!response) {
						res.json({"error" : true, "message" : "Bad guild request", "code": 0});
					} else if (!inprocess(guildConfig)) {
						res.json({"error" : false, "message" : "Guild has been found, collecting data", "code": 2});

						// Check if there is not already a fecther running
						console.log(guildConfig);
						// Start collecting new data
						fecther(guildConfig, function(data) {
							console.log(data);
							if (data) {
								// We remove it from the list of running fetchers
								inprocess(guildConfig, true);

								var db = new dbguild();

								db.name = data.name;
								db.realm = data.realm;
								db.region = data.region;
								db.roster = data.roster;
								db.events = [];
								db.teams = [];

								db.save(function(err){
									if(err) {
										console.log('GUILD NOT ADDED');
									} else {
										console.log('GUILD ADDED');
									}
								});
							}
						});
					} else {
						res.json({"error" : false, "message" : "Guild has been found, Fetcher is already running", "code": 3});
					}
				});
			}
		});
	});

app.use('/',router);
app.listen(PORT);
console.log("Application started in PORT:" + PORT);
