var utilities = require('./utilities')
  , moment = require('moment')
  , mongoose = require('mongoose');

app.get('/votes/export', utilities.checkAdmin, function(req, res, next){
	var start = Date.now();
	util.log('starting the log up! '+start);
	// Export all game data as a CSV
	var Game = mongoose.model('Game')
	  , Round = mongoose.model('Round')
	  , Vote = mongoose.model('Vote');

/* 	res.contentType('.csv'); */

	var csv = 'player ID\t player email\t player type\t game ID\t round #\t vote date\t vote time\t player\'s vote\t info type this round\t player\'s info this round\t opponent\'s info this round\n';
	
	res.writeHead(200, {
		'Content-Type': 'text/tsv',
		'Content-Disposition': 'attachment;filename=export.tsv'
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
	  , handleVote = function(round){
	  		++numVotes;
			return function(err, vote){
				// Handle the vote
				var d = moment(vote.date)
				  , addToCSV = vote.player._id + '\t ' + vote.player.email + '\t ' + (vote.player.defending ? 'defending' : 'accumulating') + '\t ' + vote.game + '\t ' + round.number + '\t ' + d.format('YYYY-MM-DD') + '\t' + d.format('hh:mm A') + '\t ' + vote.value + '\t ' + vote.player.getProfileSlug(vote.date) + '\t ' + vote.player.getProfileForCSV(vote.date) + '\t ';

				// Determine which of the players was this one in the round
				addToCSV += vote.player.getOpponentProfileForCSV(vote.date) + '\n';
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
					Vote.findById(vote).populate('player').run(handleVote(round));
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

app.get('/votes/export/all', utilities.checkAdmin, function(req, res, next){
	var start = Date.now();
	util.log('starting the log up! '+start);
	// Export all game data as a CSV
	var Game = mongoose.model('Game')
	  , Round = mongoose.model('Round')
	  , Vote = mongoose.model('Vote');

/* 	res.contentType('.csv'); */

	var csv = 'player ID\t player email\t player type\t game ID\t vote date\t vote time\t player\'s vote\t info type this round\t player\'s info this round\t opponent\'s info this round\n';
	
	res.writeHead(200, {
		'Content-Type': 'text/tsv',
		'Content-Disposition': 'attachment;filename=export-all.tsv'
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
	  , hasFoundGame = false
	  , numGames = 0
	  , games = {}
	  , queryDataFunction = function(vote){
	  		++numGames;

	  		++numVotes;
	  		hasFoundGame = true;

			var d = moment(vote.date)
			  , addToCSV = vote.player._id + '\t ' + vote.player.email + '\t ' + (vote.player.defending ? 'defending' : 'accumulating') + '\t ' + vote.game + '\t ' + round.number + '\t ' + d.format('YYYY-MM-DD') + '\t' + d.format('hh:mm A') + '\t ' + vote.value + '\t ' + vote.player.getProfileSlug(vote.date) + '\t ' + vote.player.getProfileForCSV(vote.date) + '\t ';

			// Determine which of the players was this one in the round
			addToCSV += vote.player.getOpponentProfileForCSV(vote.date) + '\n';
			res.write(addToCSV);

			checkDone();
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
	  		var query = Vote.find().populate('player').asc('date');
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