var form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Player = mongoose.model('Player')
  , csv = require('csv')
  , moment = require('moment')
  , util = require('util')
  , auth = require('./auth');

app.get('/players', auth.authorize(2, 10), function(req, res){
	Player.find({}).sort('name').exec(function(err, players){
		res.render('players/index', {title: 'All Players', players: players, moment: moment});
	});
});

/*
// Saving for now.
app.get('/players/defending', auth.authorize(2, 10), function(req, res){
	Player.find({defending:true}).sort('name').exec(function(err, players){
		res.render('players/index', {title: 'All Players', players: players, moment: moment});
	});
});
app.get('/players/nondefending', auth.authorize(2, 10), function(req, res){
	Player.find({defending:false}).sort('name').exec(function(err, players){
		res.render('players/index', {title: 'All Players', players: players, moment: moment});
	});
});
*/

// (as, populate, title, object, template, varNames, redirect, beforeRender, beforeSave)
var as = 'player'
  , populate = 'votes'
  , template = 'players/form'
  , varNames = ['email', 'name', 'twitter', 'facebook', 'flickr', 'tumblr', 'youtube']
  , redirect = 'back'
  , formValidate = form(
		field('email').trim()
	  , field('name').trim()
	  , field('twitter').trim()
	  , field('facebook').trim()
	  , field('flickr').trim()
	  , field('tumblr').trim()
	  , field('youtube').trim()
	);

/*
// Saving for now.
app.get('/players/add', auth.authorize(2, 10), utilities.doForm(as, populate, 'Add New Player', Player, template, varNames, redirect));
app.post('/players/add', auth.authorize(2, 10), formValidate, utilities.doForm(as, populate, 'Add New Player', Player, template, varNames, redirect));
*/
app.get('/players/edit/:id', auth.authorize(2, 10), utilities.doForm(as, populate, 'Edit Player', Player, template, varNames, redirect));
app.post('/players/edit/:id', auth.authorize(2, 10), formValidate, utilities.doForm(as, populate, 'Edit Player', Player, template, varNames, redirect));

/*
// Saving for now.
app.get('/players/generate', auth.authorize(2, 10), function(req, res){
	req.flash('error', 'Number of players to generate is required.');
	res.redirect('/players');
	return;
});
app.get('/players/generate/:num', auth.authorize(2, 10), function(req, res){
	// Generate 6 players
	if(!req.params.num){
		req.flash('error', 'Number of players to generate is required.');
		res.redirect('/players');
		return;
	}
	var count = 0;
	for(var i=0; i<parseFloat(req.params.num); i++){
		var player = new Player();
		player.name = 'Ben Schell ('+i+')';
		player.email = 'ben.schell+frenemy'+i+'@bluepanestudio.com';
		count++;
		player.save(function(err){
			if(--count == 0){
				req.flash('info', 'Players generated successfully!');
				res.redirect('/players');
			}
		});
	}
});
*/
app.get('/players/promote/:id', auth.authorize(2, 10), function(req, res){
	Player.update({_id: req.params.id}, {$set: {role: 10}}, {}, function(){
		req.flash('info', 'Player Promoted!');
		res.redirect('/players');
	});
});
app.get('/players/demote/:id', auth.authorize(2, 10), function(req, res){
	Player.update({_id: req.params.id}, {$set: {role: 0}}, {}, function(){
		req.flash('info', 'Player Demoted!');
		res.redirect('/players');
	});
});
app.get('/players/activate/:id', auth.authorize(2, 10), function(req, res){
	Player.findById(req.params.id).exec(function(err, player){
/* 	Player.update({_id: req.params.id}, {$set: {active: true}}, {}, function(){ */
		player.active = true;
		player.save();
		player.notifyOfActivation(true, function(){
			util.log('activated: '+util.inspect(arguments));
			req.flash('info', 'Player Activated!');
			res.redirect('/players');
		});
	});
});
app.get('/players/deactivate/:id', auth.authorize(2, 10), function(req, res){
	Player.findById(req.params.id).exec(function(err, player){
		console.log('err: ', err, player);
		player.active = false;
		player.save(function(){
			player.notifyOfActivation(false, function(){
				util.log('activated: '+util.inspect(arguments));
				req.flash('info', 'Player De-activated!');
				res.redirect('/players');
			});
		});
	});
/*
	Player.update({_id: req.params.id}, {$set: {active: false}}, {}, function(){
		req.flash('info', 'Player De-activated!');
		res.redirect('/players');
	});
*/
});

app.get('/players/leaderboard/:id', function(req, res){
	if(!req.params.id){
		res.send(404);
		return;
	}
	Player.findById(req.params.id).exec(function(err, player){
		Player.find({defending: player.defending, active: true}).sort('-score').exec(function(err, players){
			res.render('players/leaderboard', {players: players, util: util});
			return;
		});
	});
});

app.get('/players/leaderboard/points-per-move/:id', function(req, res){
	if(!req.params.id){
		res.send(404);
		return;
	}
	var Vote = mongoose.model('Vote');
	Player.findById(req.params.id).exec(function(err, player){
		Player.find({defending: player.defending, active: true}).sort('-score').exec(function(err, players){
			var toHandle = players.length
			  , checkDone = function(){
					if(--toHandle == 0){
						players.sort(function(a, b){
							return b.pointsPerVote - a.pointsPerVote;
						});
						res.render('players/points-per-move-leaderboard', {players: players, util: util});
					}
				}
			  , handlePlayer = function(index){
					// Determine number of votes for this player!
					Vote.count({player: players[index]}, function(err, count){
						players[index].voteCount = count;
						players[index].pointsPerVote = 0;
						if(count > 0){
							players[index].pointsPerVote = (players[index].defending ? players[index].score-10000 : players[index].score) / count;
						}
						checkDone();
					});
				};
			for(var i=0; i<players.length; i++){
				handlePlayer(i);
			}
			return;
		});
	});
});

app.get('/players/leaderboard/points-per-move/all/:id', function(req, res){
	if(!req.params.id){
		res.send(404);
		return;
	}
	Player.find({active: true}).sort('-score').exec(function(err, players){
		for(var i=players.length-1; i>=0; i--){
			if(players[i].numVotes == 0){
				players.splice(i, 1);
			}else if(players[i].numVotes > 0){
				players[i].pointsPerVote = (players[i].defending ? players[i].score-10000 : players[i].score) / players[i].numVotes;
			}
		}
		res.render('players/points-per-move-leaderboard', {players: players, util: util});
	});
	return;
});

/*
// Saving for now.
app.get('/players/import', auth.authorize(2, 10), function(req, res){
	res.render('players/import', {title: 'Player import'});
	return;
});
app.post('/players/import', auth.authorize(2, 10), function(req, res){
	var count = 0
	  , map = []
	  , emailColumn = -1;
	csv().fromPath(req.files.csv.path).on('data', function(data, index){
		if(index === 0){
			// Establish column - paramater mapping
			for(var i=0; i<data.length; i++){
				map[i] = data[i];
			}
			for(var i=0; i<map.length; i++){
				if(map[i] == 'email'){
					emailColumn = i;
					break;
				}
			}
			return;
		}
		if(data[emailColumn]){
			Player.find({email: data[emailColumn]}).exec(function(err, players){
				var p = null;
				if(players.length){
					util.log('found exisitng player!');
					p = players[0];
				}else{
					p = new Player();
				}
				for(var i=0; i<data.length; i++){
					if(i < map.length && map[i] && data[i] && map[i] != 'ID' && data[i] != 'undefined'){
						p[map[i]] = data[i];
					}
				}
		
				util.log('populated player: '+util.inspect(p));
				p.save(function(err){
					if(err){
						util.log('couldn\'t save player! '+util.inspect(err));
					}else{
						count++;
					}
				});
			});
		}
	}).on('error', function(error){
		util.log('ERROR: '+util.inspect(error));
		req.flash('error', 'Player Import Failed! '+count+' players imported.');
		res.redirect('/players');
	}).on('end', function(count){
		util.log('created '+count+' players!');
		req.flash('info', 'Player Import Successful! '+count+' players imported.');
		res.redirect('/players');
	});
	
});
*/

app.get('/players/export', auth.authorize(2, 10), function(req, res, next){
	var start = Date.now();
	util.log('starting the log up! '+start);
	// Export all game data as a CSV
	var Player = mongoose.model('Player');

/* 	res.contentType('.csv'); */

	var csv = 'name\temail\tID\tplayer type\tplayer score\tBirthdate\tZip\tGender\tEthnicity\tColor\tTransport\tSports\tPersonality\tPolitics\tGlasses\tPets\tBirthplace\n';
	
	res.writeHead(200, {
		'Content-Type': 'text/tsv',
		'Content-Disposition': 'attachment;filename=player-export-all.tsv'
	});
	
	res.write(csv);

	var numPlayers = 0
	  , stream = null
	  , totallyDone = false
	  , checkDone = function(){
			if(--numPlayers == 0){
				if(totallyDone){
					util.log('totally done!');
					if(hasFoundPlayer){
						// We found at least one game
						// Maybe the query needs to be re-run starting at an offset of offset
						createQueryStream(offset);
					}else{
						res.end();
					}
				}
			}
		}
	  , hasFoundPlayer = false
	  , offset = 0
	  , games = {}
	  , queryDataFunction = function(player){
	  		++offset;

	  		++numPlayers;
	  		hasFoundPlayer = true;
			var addToCSV = player.name + '\t' + player.email + '\t' + player._id + '\t' + (player.defending ? 'defending' : 'accumulating') + '\t' + player.score + '\t' + player.Birthdate + '\t' + player.Zip + '\t' + player.Gender + '\t' + player.Ethnicity + '\t' + player.Color + '\t' + player.Transport + '\t' + player.Sports + '\t' + player.Personality + '\t' + player.Politics + '\t' + player.Glasses + '\t' + player.Pets + '\t' + player.Birthplace + '\n';
			// Determine which of the players was this one in the round
			res.write(addToCSV);
			checkDone();
		}
	  , queryErrorFunction = function(){
			res.end();
		}
	  , queryCloseFunction = function(){
			totallyDone = true;
			++numPlayers;
			checkDone();
		}
	  , createQueryStream = function(skip){
	  		var query = Player.find().sort('name');
	  		if(skip){
		  		query.skip(skip);
	  		}
	  		hasFoundPlayer = false;
	  		stream = query.stream();
			stream.on('data', queryDataFunction);
			stream.on('error', queryErrorFunction);
			stream.on('close', queryCloseFunction); //.run(function(err, games){
	  	};
	createQueryStream();
	return;
});

/*
// Saving for now.
app.get('/players/resetScores/d23bd87', auth.authorize(2, 10), function(req, res, next){
	Player.update({defending: true}, { $set: { score: 10000 }}, { multi: true }, function(){
		util.log('did reset defending players!');
		util.log(util.inspect(arguments));

		Player.update({defending: false}, { $set: { score: 0 }}, { multi: true }, function(){
			util.log('did reset accumulating players!');
			util.log(util.inspect(arguments));

			req.flash('error', 'Player scores reset!');
			res.redirect('/players');
		});
	});
});
*/