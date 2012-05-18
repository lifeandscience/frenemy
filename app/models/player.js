var mongoose = require('mongoose')
  , mongooseAuth = require('mongoose-auth')
  , Schema = mongoose.Schema
  , config = require('../../config')
  , nodemailer = require('nodemailer')
  , jade = require('jade')
  , util = require('util');


var awsAccessKey = process.env.AWS_ACCESS_KEY || 'AKIAJGTS6FVN4QPODUUA'
  , awsSecret = process.env.AWS_SECRET || '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';

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SES", {
	AWSAccessKeyID: awsAccessKey
  , AWSSecretKey: awsSecret
});

var path = __dirname + '/../views/players/email/game_start.jade'
  , str = require('fs').readFileSync(path, 'utf8')
  , gameStartTemplate = jade.compile(str, { filename: path, pretty: true })
  , path = __dirname + '/../views/players/email/round_start.jade'
  , str = require('fs').readFileSync(path, 'utf8')
  , roundStartTemplate = jade.compile(str, { filename: path, pretty: true })
  , path = __dirname + '/../views/players/email/layout.jade'
  , str = require('fs').readFileSync(path, 'utf8')
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
		  , appId: process.env.FB_APP_ID || ''
		  , appSecret: process.env.FB_SECRET || ''
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

PlayerSchema.methods.notifyOfNewRound = function(round, url){
	util.log('notifying '+this.name+' of new round! ' + url);

	if(process.env.DO_NOTIFICATIONS){
		url = (process.env.BASEURL || 'http://localhost:5000') + url;
		var html = ''
		  , title = ''
		  , player = this;
		if(round.number == 1){
			// Game Start!
			title = 'New Game of Frenemy!';
			html = gameStartTemplate({user: player, url: url});
		}else {
			// Just round start!
			title = 'New Round of Frenemy!';
			html = roundStartTemplate({user: player, url: url});
		}
		html = layoutTemplate({title: title, body: html});
		
		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: "Experimonth <ben.schell@bluepanestudio.com>", // sender address
		    to: this.email, // list of receivers
		    subject: title, // Subject line
		    generateTextFromHTML: true,
		    html: html // html body
		}
		
		// send mail with defined transport object
		smtpTransport.sendMail(mailOptions, function(error, response){
		    if(error){
		        util.log(error);
		    }else{
		        util.log("Message sent: " + response.message);
		    }
		});
	}
};

Player = mongoose.model('Player', PlayerSchema);
exports = Player;

Player.count({}, function(err, totalPlayerCount){
	util.log('counted players!');
	util.log(util.inspect(arguments));
	
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