var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , util = require('util')
  , config = require('../../config');

var GameSchema = new Schema({
	startTime: {type: Date, default: function(){ return Date.now(); }}
  , numRounds: {
		type: Number, 
		default: function(){
			return Math.floor(Math.random() * 5) + 3;  
		}
	}
  , completed: {type: Boolean, default: false}
  , opponents: [{type: Schema.ObjectId, ref: 'Player'}]
  , currentRound: {type: Schema.ObjectId, ref: 'Round'}
  , rounds: [{type: Schema.ObjectId, ref: 'Round'}]
});

GameSchema.statics.setupGames = function(req, cb){
	var Player = mongoose.model('Player');
	Player.find({email: config.defaultNonDefenderEmail}).run(function(err, nonDefendingPlayers){
		var nonDefendingPlayer = nonDefendingPlayers.pop();
		Player.find({email: config.defaultDefenderEmail}).run(function(err, defendingPlayers){
			var defendingPlayer = defendingPlayers.pop()
			  , setupCount = 2
			  , setupGamesForPlayers = function(fillInPlayer){
					return function(err, players){
						util.log('setupGamesForPlayers: '+util.inspect(players));
						if(err){
							util.log('couldn\'t find players?!');
						}else if(players.length < 1){
							req.flash('error', 'Can\'t start games with less than 2 players');
							if(cb && --setupCount == 0){
								cb();
							}
							return;
						}else{
							util.log('woo?');
							var pickPlayer = function(){
									util.log('fill in: '+fillInPlayer.email);
									if(players.length == 0){
										return fillInPlayer;
									}
									var index = Math.floor(Math.random() * players.length);
									return players.splice(index, 1)[0];
								}
							  , count = 0;
							while(players.length > 0){
								util.log('here? '+players.length);
								// Pick two players
								var game = new Game();
								game.opponents.push(pickPlayer());
								game.opponents.push(pickPlayer());
								count++;
								game.save(function(err){
									if(err){
										util.log('game not saved!');
									}
									if(--count == 0){
										util.log('setup some of the games!');
										if(cb && --setupCount == 0){
											cb();
										}
									}
								});
							}
						}
					};
				};
			Player.find({defending: true}).where('email').ne(config.defaultDefenderEmail).asc('_id').run(setupGamesForPlayers(defendingPlayer));
			Player.find({defending: false}).where('email').ne(config.defaultNonDefenderEmail).asc('_id').run(setupGamesForPlayers(nonDefendingPlayer));
		});
	});
};

GameSchema.statics.endGames = function(cb){
	Game.update({completed: false}, {$set: {completed: true, currentRound: null}}, {multi: true}, function(){
		util.log('completed all games!');
		util.log(util.inspect(arguments));
		if(cb){
			cb();
		}
	});
};

GameSchema.pre('save', function(next){
	var game = this;
	if(game.startTime == -1){
		game.startTime = new Date();
	}
	// TODO: replace roundsPerGame
	if(!game.currentRound && game.rounds.length < game.numRounds){
		// Create a round
		var Round = mongoose.model('Round')
		  , round = new Round();
		game.currentRound = round;
		round.number = game.rounds.length+1;
		round.save(function(err){
			if(err){
				util.log('Round couldn\'t be created');
			}
			// Notify the opponents
			var Player = mongoose.model('Player');
			for(var i=0; i<2; i++){
				util.log('opponent #'+i+': '+util.inspect(game.opponents[i]));
				Player.findById(game.opponents[i]).run(function(err, opponent){
					if(opponent){
						opponent.notifyOfNewRound(round, '/games/'+game._id+'/'+round._id+'/'+opponent._id);
					}
				});
			}
			next();
		});
	}else if(game.rounds.length == game.numRounds){
		game.completed = true;
		next();
	}else{
		next();
	}
});

var Game = mongoose.model('Game', GameSchema);
exports = Game;

var cronJob = require('cron').CronJob;
var startJob = new cronJob('00 00 8 * * *', function(){
		// Runs every day at 8:00:00 AM. 
		util.log('setting up games!');
		Game.setupGames();
	}, function () {
		// This function is executed when the job stops
		util.log('did setup games!');
	}, 
	true /* Start the job right now */,
	"America/New_York" /* Time zone of this job. */
);
var endJob = new cronJob('00 00 20 * * *', function(){
		// Runs every day at 8:00:00 PM. 
		util.log('ending games!');
		Game.endGames();
	}, function () {
		// This function is executed when the job stops
		util.log('did end games!');
	}, 
	true /* Start the job right now */,
	"America/New_York" /* Time zone of this job. */
);