var CONFIG      =   require('./config')
var express     =   require("express");
var fs          =   require('fs');
var https       =   require('https');
var passport    =   require("passport");
var app         =   express();
var bodyParser  =   require("body-parser");
var dbguild     =   require("./models/guilds");
var router      =   express.Router();
var BnetStrategy = require('passport-bnet').Strategy;

// Utilities
var validateData = require("./utils/validate_response");
var getGuild     = require("./utils/validate_guild");
var fecther      = require("./fetcher");
var inprocess    = require("./utils/check_fetcher");

// Features
var DKP          = require("./dkp/dkp");
var user         = {
	"message": "You are not logged in"
};

// Globals
var guild;

app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({"extended" : false}));

// oAuth setup
passport.use(new BnetStrategy({
	clientID: CONFIG.BNET_ID,
	clientSecret: CONFIG.BNET_SECRET,
	callbackURL: "https://localhost:8888/auth/bnet/callback",
	region: "eu"
}, function(accessToken, refreshToken, profile, done) {
	return done(null, profile);
}));

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});

app.get('/auth/bnet/callback',
	passport.authenticate('bnet', { failureRedirect: '/' }),
	function(req, res) {
		user = req.user;
		res.redirect('/users/' + req.user.battletag);
	}
);

app.get('/auth/bnet',
	passport.authenticate('bnet')
);

// Start routing
router.get("/",function(req,res){
	res.json({"error" : true, "response" : "Invalid request"});
});

// If the user is requesting guild information
router.route("/view")
	.get( function (req, res) {
		var response = {};

		res.json({"error" : true, "response" : "Invalid request"});
	});

router.route("/users/:battletag")
	.get( function (req, res) {
		var response = {};

		res.json({"error" : false, "message" : user, "code": 1});
	});

router.route("/view/:name/:realm/:region/")
	.get( function (req, res) {
		var response = {};
		var guildConfig = {
			"name": req.params.name,
			"realm": req.params.realm,
			"region": req.params.region
		};

		dbguild.find(guildConfig, function(err, data) {
			if (validateData(data)) {
				res.json({"error" : false, "message" : data, "code": 1});
			} else {
				res.json({"error" : false, "message" : 'Guild Not Found', "code": 0});
			}
		});
	});

// If the user is requesting guild information
router.route("/init")
	.get( function (req, res) {
		var response = {};

		res.json({"error" : true, "Message" : "Invalid request"});
	});

router.route("/init/:name/:realm/:region/")
	.get( function (req, res) {
		var response = {};
		var guildConfig = {
			"name": req.params.name,
			"realm": req.params.realm,
			"region": req.params.region
		};

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

						// Start collecting new data
						fecther(guildConfig, function(data) {
							if (data) {
								// We remove it from the list of running fetchers
								inprocess(guildConfig, true);

								var db = new dbguild();

								db.name = guildConfig.name;
								db.realm = guildConfig.realm;
								db.region = guildConfig.region;
								db.roster = data.roster;
								db.events = db.events || [];
								db.teams = db.teams || [];

								db.save(function(err){
									if (err) {
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

// If the user is requesting guild information
router.route("/update/:name/:realm/:region/")
	.patch( function (req, res) {
		var body = req.body;
		var guildConfig = {
			"name": req.params.name,
			"realm": req.params.realm,
			"region": req.params.region
		};

		dbguild.find(guildConfig, function(err, data) {
			if (err || !data) {
				res.json({"error" : true, "message" : "Error fetching data", "code": 0});
			} else if (validateData(data)) {
				var roster = data[0].roster[0];

				if (body && body.action) {
					if (body.action.type === 'dkp') {
						DKP(dbguild, guildConfig, body, roster, function (response) {
							res.json({"error" : false, "message" : response, "code": 0});
						});
					} else {
						res.json({"error" : true, "message" : "Action Not Found", "code": 0});
					}
				} else {
					res.json({"error" : true, "message" : "Invalid request sent", "code": 0});
				}
			}
		});
	});


app.use('/', router);
https.createServer({
	key: fs.readFileSync('./keys/key.pem'),
	cert: fs.readFileSync('./keys/cert.pem')
}, app).listen(8888);

console.log("Application started in PORT:" + CONFIG.port);
