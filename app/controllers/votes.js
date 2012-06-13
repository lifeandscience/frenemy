var utilities = require('./utilities')
  , mongoose = require('mongoose');

app.get('/votes/export', utilities.checkAdmin, function(req, res, next){
	var start = Date.now();
	util.log('starting the log up! '+start);
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
	
	res.write(csv);

	var numVotes = 0
	  , stream = null
	  , totallyDone = false
	  , checkDone = function(){
			if(--numVotes == 0){
				if(totallyDone){
					util.log('totally done!');
					if(hasFoundGame){
						// We found at least one game
						// Maybe the query needs to be re-run starting at an offset of numGames
						createQueryStream(numGames);
					}else{
						res.end();
					}
				}
			}
		}
	  , handleVote = function(game, round){
	  		++numVotes;
			return function(err, vote){
				// Handle the vote
				var addToCSV = vote.player._id + ', ' + vote.player.email + ', ' + (vote.player.defending ? 'defending' : 'accumulating') + ', ' + game._id + ', ' + round.number + ', ' + vote.date + ', ' + vote.value + ', "' + vote.player.getProfileSlug(game.startTime) + '", "' + vote.player.getProfileForCSV(game.startTime) + '", "';

				// Determine which of the players was this one in the round
				var player = null;
				if(game.opponents[0]._id == vote.player._id){
					addToCSV += game.opponents[0].getOpponentProfileForCSV(game.startTime);
				}else{
					addToCSV += game.opponents[1].getOpponentProfileForCSV(game.startTime);
				}
				addToCSV += '"\n';
				res.write(addToCSV);

				checkDone();
			}
		}
	  , hasFoundGame = false
	  , numGames = 0
	  , games = {}
	  , queryDataFunction = function(game){
	  		numGames++;
			hasFoundGame = true;
			
			for(var j=0; j<game.rounds.length; j++){
				round = game.rounds[j];
				for(var k=0; k<round.votes.length; k++){
					var vote = round.votes[k];
					Vote.findById(vote).populate('player').run(handleVote(game, round));
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
	  		var query = Game.find({}, ['_id', 'rounds', 'startTime', 'opponents', 'rounds']).populate('opponents').populate('rounds', ['number', 'votes']).asc('startTime');
	  		if(skip){
		  		query.skip(skip);
	  		}
	  		hasFoundGame = false;
	  		stream = query.stream();
			stream.on('data', queryDataFunction);
			stream.on('error', queryErrorFunction);
			stream.on('close', queryCloseFunction); //.run(function(err, games){
	  	};
	createQueryStream();
	return;
});