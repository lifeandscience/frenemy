var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , util = require('util')
  , utilities = require('../../utilities')
  , config = require('../../config')
  , nrand = function() {
		var x1, x2, rad;
	
		do {
			x1 = 2 * Math.random() - 1;
			x2 = 2 * Math.random() - 1;
			rad = x1 * x1 + x2 * x2;
		} while(rad >= 1 || rad == 0);
	 
		var c = Math.sqrt(-2 * Math.log(rad) / rad);
	 
		return x1 * c;
	};

var GameSchema = new Schema({
	startTime: {type: Date, default: function(){ return Date.now(); }}
  , numRounds: {
		type: Number, 
		default: function(){
			// Std. Deviation of 1, Mean of 6!
			return Math.round((1*nrand())+6);
/* 			return Math.floor(Math.random() * 5) + 3;   */
		}
	}
  , experimonth: {type: Schema.ObjectId, ref: 'Experimonth'}
  , condition: {type: Schema.ObjectId, ref: 'ProfileQuestion'}
  , same: {type: Boolean, default: function(){
		return Math.floor(Math.random()*2) == 1;
	}}
  , completed: {type: Boolean, default: false}
  , opponents: [{type: Schema.ObjectId, ref: 'Player'}]
  , currentRound: {type: Schema.ObjectId, ref: 'Round'}
  , rounds: [{type: Schema.ObjectId, ref: 'Round'}]
});

GameSchema.statics.startGames = function(req, cb){
	if(typeof req == 'function'){
		cb = req;
		req = null;
	}
	var Experimonth = mongoose.model('Experimonth')
	  , Player = mongoose.model('Player')
	  , now = new Date();
//	Experimonth.findCurrentlyRunningExperimonths(function(err, experimonths){
	Experimonth.find({startDate: {$lte: new Date()}, endDate: {$gte: new Date()}}).populate('players').populate('conditions').exec(function(err, experimonths){
		if(err || !experimonths || experimonths.length == 0){
			console.log('error finding experimonths OR no experimonths found');
			return cb();
		}
		var i = -1
		  , pickPlayer = function(fillinPlayer, players){
				console.log('picking a player from a players array of length '+players.length);
				if(players.length == 0){
					console.log('using fill in player: ('+fillinPlayer.email+')');
					return fillinPlayer;
				}
				var index = Math.floor(Math.random() * players.length);
				return players.splice(index, 1)[0];
			}
		  , gotFillInPlayer = function(fillinPlayer, experimonth){
				// OK, we have either an even number of players 
				// OR an odd number of players but a willing fillinPlayer
				
				// Now, let's randomly pair up players.
				var playerOne = pickPlayer(fillinPlayer, experimonth.players)
				  , playerTwo = pickPlayer(fillinPlayer, experimonth.players);
				
				// We have players, let's create a game.
				var game = new Game();
				game.opponents.push(playerOne);
				game.opponents.push(playerTwo);
				game.experimonth = experimonth._id;
				game.condition = experimonth.conditions[Math.floor(Math.random()*experimonth.conditions.length)];
				game.save(function(err){
					if(err){
						console.log('error saving: ', game);
						return cb();
					}

					playerOne.games.push(game);
					playerOne.save();
					playerTwo.games.push(game);
					playerTwo.save();

					console.log('saved game successfully! ', game);
					handleExperimonth();
				});
			}
		  , handleExperimonth = function(){
				if(++i == experimonths.length){
					// We're finished!
					return cb();
				}
				var experimonth = experimonths[i]
				  , fillinPlayer = null;
				if(experimonth.players.length % 2){
					// Find an admin player to use
					for(var j=0; j<experimonth.players.length; j++){
						if(experimonth.players[j].role >= 10){
							fillinPlayer = experimonth.players[j];
							break;
						}
					}
					if(!fillinPlayer){
						// None of the enrolled players was an admin, so grab an arbitrary admin.
						Player.find({role: {$gte: 10}}).exec(function(err, admins){
							if(err || !admins || admins.length == 0){
								return cb();
							}
							var idx = Math.floor(Math.random()*admins.length);
							gotFillInPlayer(admins[idx], experimonth);
						});
						return;
					}
				}
				gotFillInPlayer(fillinPlayer, experimonth);
			};
		handleExperimonth();
	});
	return;
	
	
	var Player = mongoose.model('Player');
	Player.find({email: config.defaultNonDefenderEmail}).run(function(err, nonDefendingPlayers){
		var nonDefendingPlayer = nonDefendingPlayers.pop();
		Player.find({email: config.defaultDefenderEmail}).run(function(err, defendingPlayers){
			var defendingPlayer = defendingPlayers.pop()
			  , setupCount = 2
			  , setupGamesForPlayers = function(fillInPlayer){
					return function(err, players){
						util.log('setupGamesForPlayers: '+players.length); //util.inspect(players));
						for(var i=0; i<players.length; i++){
							var player = players[i];
							if( player._id.toString() == defendingPlayer._id.toString() ||
								player._id.toString() == nonDefendingPlayer._id.toString()){
								players.splice(i, 1);
							}
						}
						if(err){
							util.log('couldn\'t find players?!');
							if(cb && --setupCount == 0){
								cb();
							}
						}else if(players.length < 1){
							if(req){
								req.flash('error', 'Can\'t start games with less than 2 players');
							}else{
								util.log('Can\'t start games with less than 2 players');
							}

							if(cb && --setupCount == 0){
								cb();
							}
							return;
						}else{
							var pickPlayer = function(){
									util.log('picking a player from a players array of length '+players.length);
									if(players.length == 0){
										util.log('using fill in player: ('+fillInPlayer.email+')');
										return fillInPlayer;
									}
									var index = Math.floor(Math.random() * players.length);
									return players.splice(index, 1)[0];
								}
							  , count = 0;
							while(players.length > 0){
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
										util.log('setup some of the games! ('+setupCount+')');
										if(cb && --setupCount == 0){
											cb();
										}
									}
								});
							}
						}
					};
				};
			util.log('attempting to exclude: '+defendingPlayer._id.toString());
			Player.where('defending', true).where('active', true).where('_id').ne(defendingPlayer._id.toString()).run(setupGamesForPlayers(defendingPlayer));
			util.log('attempting to exclude: '+nonDefendingPlayer._id.toString());
			Player.where('defending', false).where('active', true).where('_id').ne(nonDefendingPlayer._id.toString()).run(setupGamesForPlayers(nonDefendingPlayer));
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
			if(round.number == 1){
				// Notify the opponents of the new game
				var Player = mongoose.model('Player')
				  , count = 0;
				for(var i=0; i<2; i++){
					util.log('opponent #'+i+': '+util.inspect(game.opponents[i]));
					count++;
					Player.findById(game.opponents[i]).exec(function(err, opponent){
						if(opponent){
							opponent.rounds.push(round);
							opponent.save();
							opponent.notifyOfNewRound(round, 'new-game', '/games/'+game._id+'/'+round._id+'/'+opponent._id, function(){
								if(--count == 0){
									next();
								}
							});
						}else if(--count == 0){
							next();
						}
					});
				}
			}else{
				next();
			}
		});
	}else if(game.rounds.length == game.numRounds){
		game.completed = true;
		next();
	}else{
		next();
	}
});
GameSchema.post('save', function(game){
	console.log('io: ', utilities.io);
	console.log('emitting: ', 'game-'+game._id);
	utilities.io.sockets.emit('game-'+game._id, 'saved');
});

var players = null
  , regenerateCallbacks = null;
GameSchema.statics.regenerateLeaderboard = function(){
	var numVotes = 0
	  , stream = null
	  , totallyDone = false
	  , handleVote = function(err, vote){
			if(vote && vote.player.active){
				if(!players[vote.player._id]){
					players[vote.player._id] = {
						numVotes: 0
					  , friendCount: 0
					};
				}
				players[vote.player._id].numVotes++;
				if(vote.value == 'friend'){
					players[vote.player._id].friendCount++;
				}
			}
			checkDone();
		}
	  , checkDone = function(){
			if(--numVotes == 0 && totallyDone){
				util.log('totally done!');
				if(hasFoundGame){
					// We found at least one game
					// Maybe the query needs to be re-run starting at an offset of numGames
					console.log('iterating on a new query stream!!');
					createQueryStream(numGames);
				}else if(regenerateCallbacks && regenerateCallbacks.length){
					// Done!
					// Call all of the callbacks
					console.log('calling callbacks! ' + util.inspect(players));
					for(var i=0; i<regenerateCallbacks.length; i++){
						regenerateCallbacks[i](players);
					}
				}else{
					console.log('no callbacks: '+util.inspect(players));
					
					var numPlayers = 0
					  , Player = mongoose.model('Player');
					for(var id in players){
						util.log('item: '+id+' -> '+util.inspect(players[id]));
						++numPlayers;
						Player.findById(id).run(function(err, player){
							player.numVotes = players[player._id].numVotes;
							player.friendCount = players[player._id].friendCount;
							player.save(function(){
								if(--numPlayers == 0){
									// Done!
									util.log('saved all players!');
								}
							});
						});
					};
				}
			}
		}
	  , hasFoundGame = false
	  , numGames = 0
	  , games = {}
	  , queryDataFunction = function(game){
	  		++numGames;
	  		hasFoundGame = true;
	  		// TODO:
			var Vote = mongoose.model('Vote')
			  , round = null;
			for(var j=0; j<game.rounds.length; j++){
				round = game.rounds[j];
				if(round.votes.length == 2){
					// It was a full round!
					for(var k=0; k<2; k++){
						numVotes++;
						Vote.findById(round.votes[k], ['value', 'player']).populate('player').run(handleVote);
					}
				}
			}
		}
	  , queryErrorFunction = function(){
			res.end();
		}
	  , queryCloseFunction = function(){
			totallyDone = true;
			++numVotes;
			checkDone();
		}
	  , createQueryStream = function(skip){
	  		var query = Game.find({}, ['startTime', 'rounds']).populate('rounds').sort('-startTime').where('startTime').gt(new Date(2012, 5, 22));
	  		if(skip){
		  		query.skip(skip);
	  		}
	  		hasFoundGame = false;
	  		stream = query.stream();
			stream.on('data', queryDataFunction);
			stream.on('error', queryErrorFunction);
			stream.on('close', queryCloseFunction); //.run(function(err, games){
	  	};
	players = {};
	createQueryStream();
};
GameSchema.statics.getLeaderboard = function(cb){
	if(players){
		cb(players);
		return;
	}
	if(!regenerateCallbacks){
		if(cb){
			regenerateCallbacks = [cb];
		}
		Game.regenerateLeaderboard();
		return;
	}
	if(cb){
		regenerateCallbacks.push(cb);
	}
	return;
};

var Game = mongoose.model('Game', GameSchema);
/* Game.getLeaderboard(); */
exports = Game;

/*
var cronJob = require('cron').CronJob;
var startJob = new cronJob('00 00 8 * * *', function(){
		// Runs every day at 8:00:00 AM. 
		util.log('setting up games!');
		Game.setupGames();
	}, function () {
		// This function is executed when the job stops
		util.log('did setup games!');
	}, 
	true /* Start the job right now * /,
	"America/New_York" /* Time zone of this job. * /
);
var endJob = new cronJob('00 00 20 * * *', function(){
		// Runs every day at 8:00:00 PM. 
		util.log('ending games!');
		Game.endGames();
	}, function () {
		// This function is executed when the job stops
		util.log('did end games!');
	}, 
	true /* Start the job right now * /,
	"America/New_York" /* Time zone of this job. * /
);
//*/