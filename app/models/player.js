var mongoose = require('mongoose')
  , mongooseAuth = require('mongoose-auth')
  , Schema = mongoose.Schema
  , config = require('../../config')
  , nodemailer = require('nodemailer')
  , jade = require('jade')
  , fs = require('fs')
  , util = require('util');


var awsAccessKey = process.env.AWS_ACCESS_KEY || 'AKIAJGTS6FVN4QPODUUA'
  , awsSecret = process.env.AWS_SECRET || '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';

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SES", {
	AWSAccessKeyID: awsAccessKey
  , AWSSecretKey: awsSecret
});

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
  , path = __dirname + '/../views/players/email/layout.jade'
  , str = fs.readFileSync(path, 'utf8')
  , layoutTemplate = jade.compile(str, { filename: path, pretty: true });


var shouldNextPlayerDefend = true
  , PlayerSchema = new Schema({
		name: String
	  , email: String
	  , isAdmin: {type: Boolean, default: false}
	  , timezone: {type: String, enum: ['Eastern', 'Central', 'Mountain', 'Pacific'], default: 'Eastern'}

	  , defending: {type: Boolean, default: function(){
			var toReturn = shouldNextPlayerDefend;
			shouldNextPlayerDefend = !shouldNextPlayerDefend;
			return toReturn;
		}}
	  , score: {type: Number, default: -1}
	  , active: {type: Boolean, default: true}
	  , lastPlayed: {type: Date}
	  
	  , image: {type: String}
	  , twitter: {type: String}
	  , facebook: {type: String}
	  , flickr: {type: String}
	  , tumblr: {type: String}
	  , youtube: {type: String}
	  
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
	})
  , Player = null;

PlayerSchema.plugin(mongooseAuth, {
	everymodule: {
		everyauth: {
			User: function () {
				return Player;
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

PlayerSchema.pre('save', function(next){
	if(this.score == -1){
		if(this.defending){
			this.score = config.defaultHighPoints;
		}else{
			this.score = config.defaultLowPoints;
		}
	}
	next();
});

PlayerSchema.methods.notifyOfNewRound = function(round, type, url, cb){
	util.log('notifying '+this.name+' of new round! ' + url);

	if(process.env.DO_NOTIFICATIONS){
		util.log('will DO_NOTIFICATIONS');
		url = (process.env.BASEURL || 'http://localhost:5000') + url;
		var html = ''
		  , title = ''
		  , player = this;
		if(type == 'nudge'){
			title = 'Your Turn in Frenemy!';
			html = nudgeTemplate({user: player, url: url});
		}else if(type == 'new-game'){
			// Game Start!
			title = 'New Game of Frenemy!';
			html = newGameTemplate({user: player, url: url});
		}else if(type == 'end-of-round'){ // type == 'new-round'
			// Just round start!
			title = 'End of Round of Frenemy!';
			html = endOfRoundTemplate({user: player, url: url});
		}else { // type == 'end-of-game'
			// Just round start!
			title = 'End of Game of Frenemy!';
			html = endOfGameTemplate({user: player, url: url});
		}
		html = layoutTemplate({title: title, body: html});
		
		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: "Experimonth: Frenemy <experimonth@lifeandscience.org>", // sender address
		    to: this.email, // list of receivers
		    subject: title, // Subject line
		    generateTextFromHTML: true,
		    html: html // html body
		}
		
		// send mail with defined transport object
		smtpTransport.sendMail(mailOptions, function(error, response){
		    if(error){
		        util.log('Email message not sent: '+util.inspect(error));
//		    }else{
//		        util.log("Message sent: " + response.message);
		    }
		    if(cb){
		    	cb();
		    }
		});
	}else if(cb){
		cb();
	}
};

PlayerSchema.methods.getProfile = function(){
	var d = new Date();
	return this['profile_'+d.getDay()];
};

PlayerSchema.methods.getOpponentProfile = function(){
	var d = new Date();
	return this['opponent_profile_'+d.getDate()];
};

Player = mongoose.model('Player', PlayerSchema);
exports = Player;

Player.count({}, function(err, totalPlayerCount){
	Player.count({defending: true}, function(err, defendingPlayerCount){
		shouldNextPlayerDefend = (totalPlayerCount - defendingPlayerCount ) > defendingPlayerCount;
	});
});
Player.find({email: config.defaultNonDefenderEmail}).run(function(err, players){
	if(err || !players || players.length == 0){
		// Create a player!
		var player = new Player();
		player.name = config.defaultNonDefenderEmail;
		player.email = config.defaultNonDefenderEmail;
		player.isAdmin = true;
		player.defending = false;
		player.save();
	}
});
Player.find({email: config.defaultDefenderEmail}).run(function(err, players){
	if(err || !players || players.length == 0){
		// Create a player!
		var player = new Player();
		player.name = config.defaultDefenderEmail;
		player.email = config.defaultDefenderEmail;
		player.isAdmin = true;
		player.defending = true;
		player.save();
	}
});
config.admins.forEach(function(item, index){
	Player.find({email: item}).run(function(err, players){
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
		player.isAdmin = true;
		player.save();
	});
});