var mongoose = require('mongoose')
//  , mongooseAuth = require('mongoose-auth')
  , Schema = mongoose.Schema
  , config = require('../config')
  , jade = require('jade')
  , fs = require('fs')
  , moment = require('moment')
  , crypto = require('crypto')
  , util = require('util')
  , auth = require('../auth');


var PlayerSchema = new Schema({
		active: {type: Boolean, default: true}
	  , remote_user: String
	  , name: String

	  , experimonth: String // An ID from the auth server of an Experimonth
	  , experimonthName: String // A name from the auth server of an Experimonth
	  , games: [{type: Schema.ObjectId, ref: 'Game'}]
	  , rounds: [{type: Schema.ObjectId, ref: 'Round'}]
	  , votes: [{type: Schema.ObjectId, ref: 'Vote'}]

	  , score: {type: Number, default: 0}
	  , lastPlayed: {type: Date}
	  , lastVote: {type: String, default: null}
	  
	  , numVotes: {type: Number, default: 0}
	  , friendCount: {type: Number, default: 0}
	  
	  , numWalkaways: {type: Number, default: 0}
	  , numWalkedAwayFrom: {type: Number, default: 0}
	  
	  , number: {type: Number, default: -1}
	  
	  , reputations: [{
			value: String
		  , date: {type: Date, default: function(){ return Date.now() }}
		}]
	})
  , Player = null;
  
PlayerSchema.pre('save', function(next){
	if(this.number != -1){
		return next();
	}
	Player.count().exec(function(err, count){
		this.number = count+1;
		return next();
	});
});

PlayerSchema.method('notify', function(type, format, subject, text, callback){
	if(!type){
		type = 'warning';
	}
	if(!format || format.length == 0){
		format = ['web'];
	}
	if(!text){
		return callback(new Error('Can\t notify without a message!'));
	}
	auth.doAuthServerClientRequest('POST', '/api/1/notifications', {
		type: type
	  , format: format
	  , subject: subject
	  , text: text
	  , user: this.remote_user
	}, function(err, body){
		// TODO: Do something with the result? Or maybe not?
		callback(err, body);
	});
});

PlayerSchema.methods.notifyOfNewRound = function(round, type, url, game, cb){
	if(!cb){
		cb = game;
		game = null;
	}
	url = process.env.BASEURL + url;
	url += '?utm_campaign='+type+'&utm_medium=email&utm_source=all';
	var html = ''
	  , title = ''
	  , player = this;
	if(type == 'nudge'){
		title = 'Your Turn in Frenemy';
		html = 'The other player has made a move. Click the address below to see what they picked and make your next move. \n\n'+url;
	}else if(type == 'new-game'){
		// Game Start!
		title = 'Frenemy New Game';
		html = 'Your daily game of Experimonth: Frenemy has begun. ';
		if(game && game.mode){
			switch(game.mode){
				case 'neutral':
					html += 'In today\'s game, the other player will remain completely anonymous. You don\'t get to know anything about them except for what moves they make during the game. ';
					break;
				case 'walkaway':
					html += 'In today\'s game, you can stop the game early if you want by selecting the "Leave" icon. ';
					break;
				case 'play-by-play':
					html += 'In today\'s game, you will be able to see play-by-play of moves in the game to remind you both what you played earlier in the day. ';
					break;
				case 'condition-random':
					html += 'In today\'s game, you will learn one piece of information about the other player. Select "Other Player" to see what that piece of information is. ';
					break;
				case 'condition':
					html += 'In today\'s game, you will get to see a graph of how many times everyone\'s played friend as a move so far. ';
					break;
				case 'reputation-request':
					html += 'In today\'s game, you will get to leave a "good" or "bad" reputation for the other player after the last move. This will show to their partner tomorrow. ';
					break;
				case 'reputation-display':
					html += 'In today\'s game, you will get to see what reputation the other player\'s partner gave them in yesterday\'s game. ';
					break;
				case 'cooperation-display':
					html += 'In today\'s game, you will get to see a graph of how cooperative everyone\'s been so far. ';
					break;
				case 'reputation-request-plus-scoreboard':
					html += 'In today\'s game, you will get to leave a "good" or "bad" reputation for the other player after the last move. This will show on the scoreboard and will never go away. ';
					break;
			}
		}
		html += '\n\n'+url+'\n\nToday\'s game will last between 4-8 rounds. This is selected at random each day, so neither you or the other player knows when the last round will be.\n\nThis game will expire at 12 o\'clock midnight, Eastern.\n\nAs a reminder, you must play 80% of the games this month to be eligible for the prize drawing at the end. Your score, which will be revealed in the final game, will determine how many entries you get in the drawing.';
	}else if(type == 'end-of-round'){ // type == 'new-round'
		// Just round start!
		title = 'Your Turn in Frenemy';
		html = 'You and the other player have made your moves. Click the address below to see the results and decide what you\'ll do next.\n\n'+url;
	}else { // type == 'end-of-game'
		// Just round start!
		title = 'Frenemy Game Over';
		html = 'Today\'s game of Frenemy is over. See the final play here and start thinking about your strategy for tomorrow, when you\'ll be paired with someone new.\n\n'+url;
	}
	
	this.notify('info', ['web', 'email'], title, html, cb);
	return;
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

Player.find({number: null}).exec(function(err, players){
	if(players && players.length > 0){
		var setPlayer = function(player, index){
			player.number = index;
			player.save();
		};
		for(var i=0; i<players.length; i++){
			setPlayer(players[i], i+1);
		}
	}
});
exports = Player;
