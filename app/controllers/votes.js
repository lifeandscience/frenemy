var utilities = require('./utilities')
  , mongoose = require('mongoose');

app.get('/votes/export', utilities.checkAdmin, function(req, res, next){
	// Export all game data as a CSV
	var Game = mongoose.model('Game')
	  , Round = mongoose.model('Round')
	  , Vote = mongoose.model('Vote');

/* 	res.contentType('.csv'); */

	var csv = 'player ID, player email, player type, game ID, round #, vote date, player\'s vote, info type this round, player\'s info this round, opponent\'s info this round\n';
	
	res.writeHead(200, {
		'Content-Type': 'text/csv',
		'Content-Disposition': 'attachment;filename=export.csv'
	});

	Game.find({}, ['_id', 'rounds', 'startTime', 'opponents', 'rounds']).populate('opponents').populate('rounds', ['number', 'votes'])/*.asc('startTime')*/.run(function(err, games){
		var game = null
		  , round = null
		  , numVotes = 0
		  , start = Date.now()
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
					res.write(addToCSV);
					
					if(--numVotes == 0){
						util.log('done! '+Date.now());
						util.log('total time: '+((Date.now()-start)/1000)+'s');
						res.end();
					}
				}
			};
		util.log('starting: '+Date.now());
		res.write(csv);
		
		for(var i=0; i<games.length; i++){
			game = games[i];
			for(var j=0; j<game.rounds.length; j++){
				round = game.rounds[j];
				numVotes += round.votes;
				for(var k=0; k<round.votes.length; k++){
					var vote = round.votes[k];
					Vote.findById(vote).populate('player').run(handleVote(game, round));
				}
			}
		}
	});
	return;
});