var utilities = require('./utilities')
  , mongoose = require('mongoose');

app.get('/votes/export', utilities.checkAdmin, function(req, res){
	// Export all game data as a CSV
	var Game = mongoose.model('Game')
	  , Round = mongoose.model('Round')
	  , Vote = mongoose.model('Vote');
	Game.find().populate('opponents').asc('startTime').run(function(err, games){
		var game = null
		  , round = null
		  , numVotes = 0
		  , csv = 'player ID, player email, player type, game ID, round #, vote date, player\'s vote, info type this round, player\'s info this round, opponent\'s info this round\n'
		  , handleVote = function(game, round){
				return function(err, vote){
					// Handle the vote
					var addToCSV = vote.player._id + ', ' + vote.player.email + ', ' + (vote.player.defending ? 'defending' : 'accumulating') + ', ' + game._id + ', ' + round.number + ', ' + vote.date + ', ' + vote.value + ', ' + vote.player.getProfileSlug(game.startTime) + ', ' + vote.player.getProfileForCSV(game.startTime) + ', ';

					// Determine which of the players was this one in the round
					var player = null;
					if(game.opponents[0]._id == vote.player._id){
						addToCSV += game.opponents[0].getOpponentProfileForCSV(game.startTime);
					}else{
						addToCSV += game.opponents[1].getOpponentProfileForCSV(game.startTime);
					}
					addToCSV += '\n';
					csv += addToCSV;
					
					if(--numVotes == 0){
						res.contentType('csv');
						res.send(csv);
						return;
					}
				}
			}
		  , handleRound = function(game){
				return function(err, round){
					// Handle the round!
					for(var i=0; i<round.votes.length; i++){
						var vote = round.votes[i];
						numVotes++;
						Vote.findById(vote).populate('player').run(handleVote(game, round));
					}
				};
			};
		for(var i=0; i<games.length; i++){
			game = games[i];
			for(var j=0; j<game.rounds.length; j++){
				round = game.rounds[j];
				Round.findById(round).run(handleRound(game));
			}
		}
	});
	return;
});