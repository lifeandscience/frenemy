var mongoose = require('mongoose')
//  , mongooseAuth = require('mongoose-auth')
  , Schema = mongoose.Schema
  , config = require('../../config')
  , email = require('../../email')
  , jade = require('jade')
  , fs = require('fs')
  , moment = require('moment')
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
		active: {type: Boolean, default: true}
	  , remote_user: String

	  , games: [{type: Schema.ObjectId, ref: 'Game'}]
	  , rounds: [{type: Schema.ObjectId, ref: 'Round'}]
	  , votes: [{type: Schema.ObjectId, ref: 'Vote'}]
	  , experimonths: [{type: Schema.ObjectId, ref: 'Experimonth'}]

	  , score: {type: Number, default: 0}
	  , lastPlayed: {type: Date}
	  
	  , numVotes: {type: Number, default: 0}
	  , friendCount: {type: Number, default: 0}
	  
	  , numWalkaways: {type: Number, default: 0}
	  , numWalkedAwayFrom: {type: Number, default: 0}
	})
  , Player = null;

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
