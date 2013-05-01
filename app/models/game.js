var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Mixed = mongoose.Schema.Types.Mixed
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
	}
  , auth = require('../../auth');

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
  , experimonth: String // An ID from the auth server of an Experimonth
  , condition: Mixed // An ID from the auth server of a ProfileQuestion (aka, a Condition)
  , same: {type: Boolean, default: function(){
		return Math.floor(Math.random()*2) == 1;
	}}
  , completed: {type: Boolean, default: false}
  , opponents: [{type: Schema.ObjectId, ref: 'Player'}]
  , currentRound: {type: Schema.ObjectId, ref: 'Round'}
  , rounds: [{type: Schema.ObjectId, ref: 'Round'}]
  
  , walkaway: {type: Schema.ObjectId, ref: 'Player', default: null}
});

GameSchema.statics.startGames = function(req, cb){
	if(typeof req == 'function'){
		cb = req;
		req = null;
	}
	auth.doAuthServerClientRequest('GET', '/api/1/experimonths/activeByKind/'+auth.clientID, null, function(err, experimonths){
		var Player = mongoose.model('Player')
		  , now = new Date();
	//	Experimonth.findCurrentlyRunningExperimonths(function(err, experimonths){
	/* 	Experimonth.find({startDate: {$lte: new Date()}, endDate: {$gte: new Date()}}).populate('players').populate('conditions').exec(function(err, experimonths){ */
		if(err || !experimonths || experimonths.length == 0){
			return cb();
		}
	
		var i = -1
		  , pickPlayer = function(fillinPlayer, users, callback){
				var player = null;
				if(users.length == 0){
					player = fillinPlayer;
				}else{
					var index = Math.floor(Math.random() * users.length);
					player = users.splice(index, 1)[0];
				}
				var remote_user = player._id;
				Player.find({remote_user: remote_user}).exec(function(err, player){
					if(player && player.length){
						player = player[0];
					}else{
						// Create a new player! This player has never accessed Frenemy so a Player hasn't been created
						player = new Player();
						player.remote_user = remote_user;
						return player.save(function(err, player){
							callback(err, player);
						});
					}
					callback(err, player);
				});
			}
		  , handleExperimonth = function(){
				if(++i == experimonths.length){
					// We're finished!
					return cb();
				}
				var experimonth = experimonths[i];
				if(experimonth.users.length == 0){
					// This experimonth has no users, so skip it.
					handleExperimonth();
					return;
				}
				if(experimonth.users.length == 1 && experimonth.users[0].role >= 10){
					// We only have one player and they're an admin
					// Let's skip this experimonth
					handleExperimonth();
					return;
				}
				
				// OK, we have either an even number of users 
				// OR an odd number of users but a willing fillinPlayer
				
				// Now, let's randomly pair up players.
				pickPlayer(experimonth.fillInAdmin, experimonth.users, function(err, playerOne){
					if(err || !playerOne){
						return handleExperimonth();
					}
					pickPlayer(experimonth.fillInAdmin, experimonth.users, function(err, playerTwo){
						if(err || !playerTwo){
							return handleExperimonth();
						}
				
						// We have users, let's create a game.
						var game = new Game();
						game.opponents.push(playerOne);
						game.opponents.push(playerTwo);
						game.experimonth = experimonth._id;
						game.condition = experimonth.conditions[Math.floor(Math.random()*experimonth.conditions.length)];
						game.markModified('condition');
						game.save(function(err){
							if(err){
								return cb();
							}
		
							playerOne.games.push(game);
							playerOne.save();
							// Notify the auth server!
							auth.doAuthServerClientRequest('POST', '/api/1/events', {
								user: playerOne.remote_user
							  , experimonth: game.experimonth
							  , client_id: process.env.CLIENT_ID
							  , name: 'frenemy:startGame'
							  , value: playerTwo.remote_user
							}, function(err, body){
								// TODO: Do something with the result? Or maybe not?
							});

							playerTwo.games.push(game);
							playerTwo.save();
							// Notify the auth server!
							auth.doAuthServerClientRequest('POST', '/api/1/events', {
								user: playerTwo.remote_user
							  , experimonth: game.experimonth
							  , client_id: process.env.CLIENT_ID
							  , name: 'frenemy:startGame'
							  , value: playerOne.remote_user
							}, function(err, body){
								// TODO: Do something with the result? Or maybe not?
							});
		
							handleExperimonth();
						});
					});
				});
				return;
			};
		handleExperimonth();
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

GameSchema.methods.getPointsForPlayer = function(id, cb){
	var Round = mongoose.model('Round')
	  , Vote = mongoose.model('Vote');
	this.populate('rounds', function(err, game){
		Vote.populate(game.rounds, {
			path: 'votes'
		}, function(err, rounds){
			var points = 0;
			if(rounds && rounds.length){
				rounds.forEach(function(round, index){
					points += round.getPointsForPlayer(id);
				});
			}
			cb(err, points);
		});
	});
	return;
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
							opponent.notifyOfNewRound(round, 'new-game', '/game/'+game._id+'/'+round._id, function(){
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
					createQueryStream(numGames);
				}else if(regenerateCallbacks && regenerateCallbacks.length){
					// Done!
					// Call all of the callbacks
					for(var i=0; i<regenerateCallbacks.length; i++){
						regenerateCallbacks[i](players);
					}
				}else{
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