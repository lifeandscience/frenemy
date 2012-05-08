var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , util = require('util')
  , config = require('../../config');

var GameSchema = new Schema({
	startTime: {type: Date, default: -1}
  , opponents: [{type: Schema.ObjectId, ref: 'Player'}]
  , currentRound: {type: Schema.ObjectId, ref: 'Round'}
  , rounds: [{type: Schema.ObjectId, ref: 'Round'}]
});

GameSchema.statics.setupGames = function(){
	var Player = mongoose.model('Player');
	Player.find({}).asc('_id').run(function(err, players){
		if(err){
			util.log('couldn\'t find players?!');
		}else{
			var pickPlayer = function(){
					var index = Math.floor(Math.random() * players.length);
					return players.splice(index, 1)[0];
				}
			  , count = 0;
			while(players.length > 1){
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
						util.log('setup all of the games!');
					}
				});
			}
		}
	});
};

GameSchema.pre('save', function(next){
	var game = this;
	if(game.startTime == -1){
		game.startTime = new Date();
	}
	if(!game.currentRound && game.rounds.length < config.roundsPerGame){
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
						opponent.notifyOfNewRound('/games/'+game._id+'/'+round._id+'/'+opponent._id);
					}
				});
			}
			next();
		});
	}else{
		next();
	}
});

var Game = mongoose.model('Game', GameSchema);
exports = Game;