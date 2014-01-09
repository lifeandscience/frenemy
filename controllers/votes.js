var moment = require('moment')
  , mongoose = require('mongoose')
  , config = require('./config')
  , auth = require('./auth');

app.get('/votes/export', auth.authorize(2, 10), function(req, res, next){
	var start = Date.now();
	util.log('starting the log up! '+start);
	// Export all game data as a CSV
	var Game = mongoose.model('Game')
	  , Round = mongoose.model('Round')
	  , Vote = mongoose.model('Vote');

/* 	res.contentType('.csv'); */

	var csv = 'player ID\tplayer email\tgame ID\tround #\tvote date\tvote time\tplayer\'s vote\tinfo type this round\tplayer\'s info this round\topponent\'s info this round\tBirthdate\tZip\tGender\tEthnicity\tColor\tTransport\tSports\tPersonality\tPolitics\tGlasses\tPets\tBirthplace\n';
	
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
				  , addToCSV = vote.player._id + '\t' + vote.player.email + '\t' + vote.game + '\t' + round.number + '\t' + d.format('YYYY-MM-DD') + '\t' + d.format('hh:mm A') + '\t' + vote.value + '\t' + vote.player.getProfileSlug(vote.date) + '\t' + vote.player.getProfileForCSV(vote.date) + '\t';

				// Determine which of the players was this one in the round
				addToCSV += vote.player.getOpponentProfileForCSV(vote.date) + '\t' + vote.player.Birthdate + '\t' + vote.player.Zip + '\t' + vote.player.Gender + '\t' + vote.player.Ethnicity + '\t' + vote.player.Color + '\t' + vote.player.Transport + '\t' + vote.player.Sports + '\t' + vote.player.Personality + '\t' + vote.player.Politics + '\t' + vote.player.Glasses + '\t' + vote.player.Pets + '\t' + vote.player.Birthplace + '\n';
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
					Vote.findById(vote).populate('player').exec(handleVote(round));
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
	  		var query = Game.find().populate('opponents').populate('rounds').sort('startTime');
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

app.get('/votes/export/all', auth.authorize(2, 10), function(req, res, next){
	var start = Date.now();
	util.log('starting the log up! '+start);
	// Export all game data as a CSV
	var Game = mongoose.model('Game')
	  , Round = mongoose.model('Round')
	  , Vote = mongoose.model('Vote');

/* 	res.contentType('.csv'); */

	var csv = 'player ID\tplayer email\tgame ID\tvote date\tvote time\tplayer\'s vote\tinfo type this round\tplayer\'s info this round\topponent\'s info this round\tBirthdate\tZip\tGender\tEthnicity\tColor\tTransport\tSports\tPersonality\tPolitics\tGlasses\tPets\tBirthplace\n';
	
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
			  , addToCSV = vote.player._id + '\t' + vote.player.email + '\t' + vote.game + '\t' + d.format('YYYY-MM-DD') + '\t' + d.format('hh:mm A') + '\t' + vote.value + '\t' + vote.player.getProfileSlug(vote.date) + '\t' + vote.player.getProfileForCSV(vote.date) + '\t';

			// Determine which of the players was this one in the round
			addToCSV += vote.player.getOpponentProfileForCSV(vote.date) + '\t' + vote.player.Birthdate + '\t' + vote.player.Zip + '\t' + vote.player.Gender + '\t' + vote.player.Ethnicity + '\t' + vote.player.Color + '\t' + vote.player.Transport + '\t' + vote.player.Sports + '\t' + vote.player.Personality + '\t' + vote.player.Politics + '\t' + vote.player.Glasses + '\t' + vote.player.Pets + '\t' + vote.player.Birthplace + '\n';
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
	  		var query = Vote.find().populate('player').sort('date');
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




app.get('/votes/export/score', auth.authorize(2, 10), function(req, res, next){
	var start = Date.now();
	util.log('starting the log up! '+start);
	// Export all game data as a CSV
	var Game = mongoose.model('Game')
	  , Round = mongoose.model('Round')
	  , Vote = mongoose.model('Vote');

/* 	res.contentType('.csv'); */

	var csv = 'player ID\tplayer email\tgame ID\tround #\tvote date\tvote time\tplayer\'s vote\tplayer\'s score\tinfo type this round\tplayer\'s info this round\topponent\'s info this round\tBirthdate\tZip\tGender\tEthnicity\tColor\tTransport\tSports\tPersonality\tPolitics\tGlasses\tPets\tBirthplace\n';
	
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
	  , printVote = function(round, vote, score){
			var d = moment(vote.date)
			  , addToCSV = vote.player._id + '\t' + vote.player.email + '\t' + vote.game + '\t' + round.number + '\t' + d.format('YYYY-MM-DD') + '\t' + d.format('hh:mm A') + '\t' + vote.value + '\t' + score + '\t' + vote.player.getProfileSlug(vote.date) + '\t' + vote.player.getProfileForCSV(vote.date) + '\t';

			// Determine which of the players was this one in the round
			addToCSV += vote.player.getOpponentProfileForCSV(vote.date) + '\t' + vote.player.Birthdate + '\t' + vote.player.Zip + '\t' + vote.player.Gender + '\t' + vote.player.Ethnicity + '\t' + vote.player.Color + '\t' + vote.player.Transport + '\t' + vote.player.Sports + '\t' + vote.player.Personality + '\t' + vote.player.Politics + '\t' + vote.player.Glasses + '\t' + vote.player.Pets + '\t' + vote.player.Birthplace + '\n';
			res.write(addToCSV);
		}
	  , handleVote = function(round, voteOne, voteTwo){
			// Handle the vote
			var score = -1;
			if(voteOne){
				if(voteTwo){
					if(voteOne.value == voteTwo.value){
						if(voteOne.value == 'friend'){
							score = config.points.winningTie;
						}else{
							score = config.points.losingTie;
						}
					}else if(voteOne.value == 'friend'){
						score = config.points.loss;
					}else{
						score = config.points.win;
					}
					printVote(round, voteOne, score);

					score = -1;
					if(voteTwo.value == voteOne.value){
						if(voteTwo.value == 'friend'){
							score = config.points.winningTie;
						}else{
							score = config.points.losingTie;
						}
					}else if(voteTwo.value == 'friend'){
						score = config.points.loss;
					}else{
						score = config.points.win;
					}
					printVote(round, voteTwo, score);
				}else{
					printVote(round, voteOne, score);
				}
			}
			checkDone();
		}
	  , doRound = function(round){
			if(round.votes.length > 0){
				++numVotes;
				Vote.findById(round.votes[0]).populate('player').exec(function(err, voteOne){
					if(round.votes.length > 1){
						Vote.findById(round.votes[1]).populate('player').exec(function(err, voteTwo){
							handleVote(round, voteOne, voteTwo);
						});
					}else{
						handleVote(round, voteOne);
					}
				});
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
				doRound(round);
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
	  		var query = Game.find().populate('opponents').populate('rounds').sort('startTime');
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