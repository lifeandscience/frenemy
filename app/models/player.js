var mongoose = require('mongoose')
//  , mongooseAuth = require('mongoose-auth')
  , Schema = mongoose.Schema
  , config = require('../../config')
  , email = require('../../email')
  , jade = require('jade')
  , fs = require('fs')
  , moment = require('moment')
  , bcrypt = require('bcrypt')
  , crypto = require('crypto')
  , util = require('util');



var path = __dirname + '/../views/players/email/new_game.jade'
  , str = fs.readFileSync(path, 'utf8')
  , newGameTemplate = jade.compile(str, { filename: path, pretty: true })
  , path = __dirname + '/../views/players/email/end_of_round.jade'
  , str = fs.readFileSync(path, 'utf8')
  , endOfRoundTemplate = jade.compile(str, { filename: path, pretty: true })
  , path = __dirname + '/../views/players/email/end_of_game.jade'
  , str = fs.readFileSync(path, 'utf8')
  , endOfGameTemplate = jade.compile(str, { filename: path, pretty: true })
  , path = __dirname + '/../views/players/email/nudge.jade'
  , str = fs.readFileSync(path, 'utf8')
  , nudgeTemplate = jade.compile(str, { filename: path, pretty: true })
  , path = __dirname + '/../views/players/email/activation.jade'
  , str = fs.readFileSync(path, 'utf8')
  , activationTemplate = jade.compile(str, { filename: path, pretty: true })
  , path = __dirname + '/../views/players/email/deactivation.jade'
  , str = fs.readFileSync(path, 'utf8')
  , deactivationTemplate = jade.compile(str, { filename: path, pretty: true })
  , path = __dirname + '/../views/players/email/confirm_email.jade'
  , str = fs.readFileSync(path, 'utf8')
  , confirmEmailTemplate = jade.compile(str, { filename: path, pretty: true })
  , path = __dirname + '/../views/players/email/layout.jade'
  , str = fs.readFileSync(path, 'utf8')
  , layoutTemplate = jade.compile(str, { filename: path, pretty: true });


var shouldNextPlayerDefend = true
  , PlayerSchema = new Schema({
		name: String
	  , hash: String
	  , salt: String
	  , email: String
		// STATE
		//	Replaces "active", known values:
		//	 0: Newly-registered
		//	 1: Registered, but no email provided (Twitter)
		//	 2: Email address confirmed - Fully Active
		//	 3: Email provided by external service (FB) - Fully Active
		//	10: Fully Active (manual?)
	  , state: {type: Number, default: 0}
	  , active: {type: Boolean, default: true}
	  	// ROLE
	  	// 	Replaces "isAdmin"; known values:
	  	//	 0: Basic user
	  	//	10: Admin
	  , role: {type: Number, default: 0}
	  , games: [{type: Schema.ObjectId, ref: 'Game'}]
	  , rounds: [{type: Schema.ObjectId, ref: 'Round'}]
	  , votes: [{type: Schema.ObjectId, ref: 'Vote'}]
	  , experimonths: [{type: Schema.ObjectId, ref: 'Experimonth'}]
	  
	  , activationCode: String
	  , fb: Schema.Types.Mixed // FB Profile
	  , twid: String
	  , tw: Schema.Types.Mixed // Twitter Profile

	  , score: {type: Number, default: 0}
	  , lastPlayed: {type: Date}

	  , twitter: {type: String}
	  , facebook: {type: String}
	  , flickr: {type: String}
	  , tumblr: {type: String}
	  , youtube: {type: String}

	  , opt_out: {type: Boolean, default: false}
	  
	  , numVotes: {type: Number, default: 0}
	  , friendCount: {type: Number, default: 0}
	  
	  , numWalkaways: {type: Number, default: 0}
	  , numWalkedAwayFrom: {type: Number, default: 0}
/*
	  , isAdmin: {type: Boolean, default: false}
	  , timezone: {type: String, enum: ['Eastern', 'Central', 'Mountain', 'Pacific'], default: 'Eastern'}
	  

	  , defending: {type: Boolean, default: false}
	  , defendingNum: {type: Number, default: -1}
	  
	  , image: {type: String}
	  
	  , profile_0: {type: String, default: 'My Profile (Sunday)'}
	  , profile_1: {type: String, default: 'My Profile (Monday)'}
	  , profile_2: {type: String, default: 'My Profile (Tuesday)'}
	  , profile_3: {type: String, default: 'My Profile (Wednesday)'}
	  , profile_4: {type: String, default: 'My Profile (Thursday)'}
	  , profile_5: {type: String, default: 'My Profile (Friday)'}
	  , profile_6: {type: String, default: 'My Profile (Saturday)'}
	  
	  , opponent_profile_1: {type: String, default: 'Opponent Profile (1)'}
	  , opponent_profile_2: {type: String, default: 'Opponent Profile (2)'}
	  , opponent_profile_3: {type: String, default: 'Opponent Profile (3)'}
	  , opponent_profile_4: {type: String, default: 'Opponent Profile (4)'}
	  , opponent_profile_5: {type: String, default: 'Opponent Profile (5)'}
	  , opponent_profile_6: {type: String, default: 'Opponent Profile (6)'}
	  , opponent_profile_7: {type: String, default: 'Opponent Profile (7)'}
	  , opponent_profile_8: {type: String, default: 'Opponent Profile (8)'}
	  , opponent_profile_9: {type: String, default: 'Opponent Profile (9)'}
	  , opponent_profile_10: {type: String, default: 'Opponent Profile (10)'}
	  , opponent_profile_11: {type: String, default: 'Opponent Profile (11)'}
	  , opponent_profile_12: {type: String, default: 'Opponent Profile (12)'}
	  , opponent_profile_13: {type: String, default: 'Opponent Profile (13)'}
	  , opponent_profile_14: {type: String, default: 'Opponent Profile (14)'}
	  , opponent_profile_15: {type: String, default: 'Opponent Profile (15)'}
	  , opponent_profile_16: {type: String, default: 'Opponent Profile (16)'}
	  , opponent_profile_17: {type: String, default: 'Opponent Profile (17)'}
	  , opponent_profile_18: {type: String, default: 'Opponent Profile (18)'}
	  , opponent_profile_19: {type: String, default: 'Opponent Profile (19)'}
	  , opponent_profile_20: {type: String, default: 'Opponent Profile (20)'}
	  , opponent_profile_21: {type: String, default: 'Opponent Profile (21)'}
	  , opponent_profile_22: {type: String, default: 'Opponent Profile (22)'}
	  , opponent_profile_23: {type: String, default: 'Opponent Profile (23)'}
	  , opponent_profile_24: {type: String, default: 'Opponent Profile (24)'}
	  , opponent_profile_25: {type: String, default: 'Opponent Profile (25)'}
	  , opponent_profile_26: {type: String, default: 'Opponent Profile (26)'}
	  , opponent_profile_27: {type: String, default: 'Opponent Profile (27)'}
	  , opponent_profile_28: {type: String, default: 'Opponent Profile (28)'}
	  , opponent_profile_29: {type: String, default: 'Opponent Profile (29)'}
	  , opponent_profile_30: {type: String, default: 'Opponent Profile (30)'}
	  
	  , Birthdate: {type: String, default: ''}
	  , Zip: {type: String, default: ''}
	  , Gender: {type: String, default: ''}
	  , Ethnicity: {type: String, default: ''}
	  , Color: {type: String, default: ''}
	  , Transport: {type: String, default: ''}
	  , Sports: {type: String, default: ''}
	  , Personality: {type: String, default: ''}
	  , Politics: {type: String, default: ''}
	  , Glasses: {type: String, default: ''}
	  , Pets: {type: String, default: ''}
	  , Birthplace: {type: String, default: ''}
*/
	})
  , Player = null;


PlayerSchema.virtual('password').get(function (){
	return this._password;
}).set(function (password) {
	this._password = password;
	var salt = this.salt = bcrypt.genSaltSync(10);
	this.hash = bcrypt.hashSync(password, salt);
});

PlayerSchema.method('verifyPassword', function(password, callback) {
	bcrypt.compare(password, this.hash, callback);
});

PlayerSchema.method('generateActivationCode', function(){
	this.activationCode = bcrypt.genSaltSync(10);
});
PlayerSchema.method('sendActivationEmail', function(){
	var base_url = (process.env.BASEURL || 'http://localhost:5000')
	  , activation_url = base_url + '/auth/local/confirm/'+new Buffer(this.email).toString('base64')+'/'+new Buffer(this.activationCode).toString('base64')
	  , html = confirmEmailTemplate({email: this.email, base_url: base_url, activation_url: activation_url});
	html = layoutTemplate({title: 'Confirm Your Email Address', body: html, moment: moment});

	// setup e-mail data with unicode symbols
	var mailOptions = {
	    from: "Experimonth: Frenemy <experimonth@lifeandscience.org>", // sender address
	    to: this.email, // list of receivers
	    subject: 'Frenemy: Confirm Your Email Address', // Subject line
	    generateTextFromHTML: true,
	    html: html // html body
	}

	// send mail with defined transport object
	email.sendMail(mailOptions);
});
PlayerSchema.method('notify', function(message, callback){
	if(!message){
		return callback(new Error('Can\t notify without a message!'));
	}
	var Notification = mongoose.model('Notification')
	  , n = new Notification();
	n.text = message;
	n.player = this;
	n.save(function(err){
		if(err){ return callback(new Error('Trouble saving new notification!')); }
		callback(null);
	});
});

PlayerSchema.static('authenticate', function(email, password, callback) {
	this.findOne({ email: email }, function(err, player) {
		if (err) { return callback(err); }
		if (!player) { return callback(null, false, 'Either your email or password was incorrect. Please try again.'); }
		player.verifyPassword(password, function(err, passwordCorrect) {
			if (err) { return callback(err, false); }
			if (!passwordCorrect) { return callback(null, false, 'Either your email or password was incorrect. Please try again.'); }
			if(player.state < 1){
				return callback(null, player, 'Please check your email to verify your email address. (<a href="/auth/local/register/resend/'+email+'">Resend?</a>)');
			}
			return callback(null, player);
		});
	});
});
PlayerSchema.static('facebookAuthenticate', function(profile, callback){
	var email = profile.emails[0].value;
	this.findOne({email: email}, function(err, player){
		if(err){ return callback(err); }
		if(player){ return callback(null, player); }

		// Register new player!
		player = new Player();
		player.email = email;
		player.state = 3;
		player.fb = profile;
		player.markModified('fb');
		player.save(function(err){
			if(err){ return callback(err); }
			callback(null, player, 'Thanks for signing up! Please fill out your profile.');
		});
	});
});
PlayerSchema.static('twitterAuthenticate', function(profile, callback){
	this.findOne({twid: profile.id_str}, function(err, player){
		if(err){ return callback(err); }
		if(player){ return callback(null, player); }

		// Register new player!
		player = new Player();
		player.twid = profile.id_str;
		player.state = 1;
		player.tw = profile;
		player.markModified('tw');
		player.save(function(err){
			if(err){ return callback(err); }
			callback(null, player, 'Thanks for signing up! Please supply your email address.');
		});
	});
});
PlayerSchema.static('notifyAll', function(notification, callback){
	this.find().exec(function(err, players){
		if(err || !players || players.length == 0){
			callback(new Error('Error finding players to notify.'));
			return;
		}
		var count = players.length-1
		  , check = function(){
				console.log('count', count);
				if(--count == 0){
					// Done iterating over players
					callback(null);
				}
			};
		players.forEach(function(player){
			player.notify(notification, check);
		});
	});
});
// TODO: EVERYAUTH
/*
PlayerSchema.plugin(mongooseAuth, {
	everymodule: {
		everyauth: {
			User: function () {
				return Player;
			}
		  , findUserById: function (userId, fn) {
				var User = mongoose.model("Player");
				User.findById(userId, fn);
				// For some reason, the 'this' context isn't being set correctly, so hacking this in here for now.
				//this.User()().findById(userId, fn);
			}
		}
	}
  , facebook: {
		everyauth: {
			myHostname: process.env.BASEURL || 'http://localhost:5000'
		  , appId: process.env.FB_APP_ID || '240269872746246'
		  , appSecret: process.env.FB_SECRET || '7797ab8af4f7e1cda5e7f9418e7a9db5'
		  , redirectPath: '/'
		  , scope: 'email'
		  , findOrCreateUser: function (sess, accessTok, accessTokExtra, fbUser) {
				var promise = this.Promise()
				  , User = this.User()();
				console.log('user: ', User);
				// TODO Check user in session or request helper first
				//	  e.g., req.user or sess.auth.userId
				User.findOne({'fb.id': fbUser.id}, function (err, foundUser) {
					if (foundUser) {
						return promise.fulfill(foundUser);
					}
					User.findOne({'email': fbUser.email}, function(err, foundUser){
						if (foundUser) {
							return promise.fulfill(foundUser);
						}
						console.log("CREATING");
						User.createWithFB(fbUser, accessTok, accessTokExtra.expires, function (err, createdUser) {
							if (err) return promise.fail(err);

							// Add stuff!
							createdUser.name = fbUser.name;
							createdUser.email = fbUser.email;
							createdUser.save();

							return promise.fulfill(createdUser);
						});
					});
				});
				return promise;
			}
		}
	}
});
*/

PlayerSchema.pre('save', function(next){
	if(this.defendingNum == -1){
		this.defendingNum = 0;
		this.defending = shouldNextPlayerDefend;
		shouldNextPlayerDefend = !shouldNextPlayerDefend;
	}
	if(this.score == -1){
		if(this.defending){
			this.score = config.defaultHighPoints;
		}else{
			this.score = config.defaultLowPoints;
		}
	}
	next();
});

PlayerSchema.methods.notifyOfActivation = function(isActivation, cb){
	util.log('notifying '+this.email+' of deactivation');

	if(process.env.DO_NOTIFICATIONS){
		util.log('will DO_NOTIFICATIONS');
		var html = ''
		  , title = ''
		  , player = this;
		if(isActivation){
			title = 'Your Frenemy Account has been Activated!';
			html = activationTemplate({user: player});
		}else { // deactivation
			// Just round start!
			title = 'Your Frenemy Account has been Deactivated!';
			html = deactivationTemplate({user: player});
		}
		html = layoutTemplate({title: title, body: html, moment: moment});
		
		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: "Experimonth: Frenemy <experimonth@lifeandscience.org>", // sender address
		    to: this.email, // list of receivers
		    subject: title, // Subject line
		    generateTextFromHTML: true,
		    html: html // html body
		}
		
		// send mail with defined transport object
		email.sendMail(mailOptions, cb);
	}else if(cb){
		cb();
	}
};

PlayerSchema.methods.notifyOfNewRound = function(round, type, url, cb){
	util.log('notifying '+this.name+' of '+type+'! ' + url);

	if(process.env.DO_NOTIFICATIONS){
		util.log('will DO_NOTIFICATIONS');
		url = (process.env.BASEURL || 'http://localhost:5000') + url;
		url += '?utm_campaign='+type+'&utm_medium=email&utm_source=all';
		var html = ''
		  , title = ''
		  , player = this;
		if(type == 'nudge'){
			title = 'Your Turn in Frenemy!';
			html = nudgeTemplate({user: player, round: round, url: url});
		}else if(type == 'new-game'){
			// Game Start!
			title = 'New Game of Frenemy!';
			html = newGameTemplate({user: player, round: round, url: url});
		}else if(type == 'end-of-round'){ // type == 'new-round'
			// Just round start!
			title = 'End of Round of Frenemy!';
			html = endOfRoundTemplate({user: player, round: round, url: url});
		}else { // type == 'end-of-game'
			// Just round start!
			title = 'End of Game of Frenemy!';
			html = endOfGameTemplate({user: player, round: round, url: url});
		}
		html = layoutTemplate({title: title, body: html, moment: moment});
		
		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: "Experimonth: Frenemy <experimonth@lifeandscience.org>", // sender address
		    to: this.email, // list of receivers
		    subject: title, // Subject line
		    generateTextFromHTML: true,
		    html: html // html body
		}
		
		// send mail with defined transport object
		email.sendMail(mailOptions, cb);
	}else if(cb){
		cb();
	}
};
var offset = 0; // -5;
var day = false; // 4;
PlayerSchema.methods.getProfileSlug = function(d){
	switch(day ? day : d.getDay()){
		case 0:
			return 'birthday';
		case 1:
			// For #34
			return 'no-info';
/* 			return 'personality'; */
		case 2:
			return 'color';
		case 3:
			return 'voting';
		case 4: 
			return 'chat';
		case 5:
			return 'sports-team';
		case 6:
			return 'transportation';
	}
};
PlayerSchema.methods.getProfileHeading = function(d){
	switch(day ? day : d.getDay()){
		case 0:
			return 'Birthday';
		case 1:
			// For #34
			return null;
/* 			return 'Personality Type'; */
		case 2:
			return 'Favorite Color';
		case 3:
		case 4: 
			return null;
		case 5:
			return 'Favorite Sports Team';
		case 6:
			return 'Primary Transportation';
	}
};
PlayerSchema.methods.getProfile = function(d){
	switch(day ? day : d.getDay()){
		case 1:
			// For #34
			return 'Today you have no additional information about your opponent.';
		case 3:
			return 'Your voting record on the last seven games.';
		case 4:
			return 'Today you have the ability to chat with your opponent.<br/><a href="#chat">Click on the chat tab on the top of this page to do so.</a>';
		default:
			return this['profile_'+(day ? day : d.getDay())];
	}
};
PlayerSchema.methods.getProfileForCSV = function(d){
	return this['profile_'+(day ? day : d.getDay())];
};

PlayerSchema.methods.getOpponentProfile = function(d, opponent){
	switch(d.getDay()){
		case 1:
			// For #34
			return 'Today your opponent has no additional information about you.';
		case 3:
			return 'Their voting record on the last seven games.';
		case 4:
			return 'Today you have the ability to chat with your opponent.<br/><a href="#chat">Click on the chat tab on the top of this page to do so.</a>';
		default:
			return this['opponent_profile_'+((d.getDate() == 31 ? 7 : d.getDate())+offset)];
	}
};
PlayerSchema.methods.getOpponentProfileForCSV = function(d, opponent){
	return this['opponent_profile_'+((d.getDate() == 31 ? 7 : d.getDate())+offset)];
};

PlayerSchema.virtual('votingRecord');
PlayerSchema.virtual('email_hash').get(function(){
	return crypto.createHash('md5').update(this.email.toLowerCase().trim()).digest('hex');
});
PlayerSchema.pre('init', function(next, t){
	var Game = mongoose.model('Game')
	  , Round = mongoose.model('Round');
	Game.find({opponents: t._id, completed: true}).sort('-startTime').limit(7).exec(function(err, games){
		t.votingRecord = [];
		var count = 0
		  , finished = function(){
				if(--count == 0){
					// Done!
					t.votingRecord.reverse();
					next();
				}
			}
		if(games && games.length){
			count += games.length;
			games.forEach(function(game, index){
				var g = {
					startTime: game.startTime
				  , votes: []
				};
				t.votingRecord.push(g); 
				if(game.rounds && game.rounds.length){
					--count;
					count += game.rounds.length;
					game.rounds.forEach(function(roundId, index){
						Round.findById(roundId).populate('votes').exec(function(err, round){
							if(round && round.votes){
								for(var k=0; k<round.votes.length; k++){
									var vote = round.votes[k];
									if(vote.player.toString() == t._id.toString()){
										g.votes[index] = vote;
										break;
									}
								}
							}
							if(!g.votes[index]){
								g.votes[index] = false;
							}
							finished();
						});
					});
				}else{
					finished();
				}
			});
		}else{
			count++;
			finished();
		}
	});
});

Player = mongoose.model('Player', PlayerSchema);
exports = Player;

/*
Player.count({}, function(err, totalPlayerCount){
	Player.count({defending: true}, function(err, defendingPlayerCount){
		shouldNextPlayerDefend = (totalPlayerCount - defendingPlayerCount ) > defendingPlayerCount;
	});
});
Player.find({email: config.defaultDefenderEmail}).exec(function(err, players){
	if(err || !players || players.length == 0){
		// Create a player!
		var player = new Player();
		player.name = config.defaultDefenderEmail;
		player.email = config.defaultDefenderEmail;
		player.isAdmin = true;
/* 		player.defending = true; * /
		player.save(function(err, player){
			player.defending = true;
			player.save();
		});
	}
});
Player.find({email: config.defaultNonDefenderEmail}).exec(function(err, players){
	if(err || !players || players.length == 0){
		// Create a player!
		var player = new Player();
		player.name = config.defaultNonDefenderEmail;
		player.email = config.defaultNonDefenderEmail;
		player.isAdmin = true;
/* 		player.defending = false; * /
		player.save(function(err, player){
			player.defending = false;
			player.save();
		});
	}
});
*/
// TODO: Put back?
/*
config.admins.forEach(function(item, index){
	Player.find({email: item}).exec(function(err, players){
		var player = null;
		if(err || !players || players.length == 0){
			// Create a player!
			player = new Player();
			player.name = item;
			player.email = item;
			player.active = false;
		}else{
			player = players[0];
		}
		player.role = 10;
		player.save();
	});
});
//*/