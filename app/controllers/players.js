var form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Player = mongoose.model('Player')
  , csv = require('csv')
  , moment = require('moment')
  , util = require('util');

app.get('/players', utilities.checkAdmin, function(req, res){
	Player.find({}).asc('name').run(function(err, players){
		res.render('players/index', {title: 'All Players', players: players, moment: moment});
	});
});

app.get('/players/defending', utilities.checkAdmin, function(req, res){
	Player.find({defending:true}).asc('name').run(function(err, players){
		res.render('players/index', {title: 'All Players', players: players, moment: moment});
	});
});
app.get('/players/nondefending', utilities.checkAdmin, function(req, res){
	Player.find({defending:false}).asc('name').run(function(err, players){
		res.render('players/index', {title: 'All Players', players: players, moment: moment});
	});
});

// (as, populate, title, object, template, varNames, redirect, beforeRender, beforeSave)
var as = 'player'
  , populate = 'votes'
  , template = 'players/form'
  , varNames = ['email', 'image', 'name', 'twitter', 'facebook', 'flickr', 'tumblr', 'youtube', 'score', 'profile_0', 'profile_1', 'profile_2', 'profile_3', 'profile_4', 'profile_5', 'profile_6', 'opponent_profile_1', 'opponent_profile_2', 'opponent_profile_3', 'opponent_profile_4', 'opponent_profile_5', 'opponent_profile_6', 'opponent_profile_7', 'opponent_profile_8', 'opponent_profile_9', 'opponent_profile_10', 'opponent_profile_11', 'opponent_profile_12', 'opponent_profile_13', 'opponent_profile_14', 'opponent_profile_15', 'opponent_profile_16', 'opponent_profile_17', 'opponent_profile_18', 'opponent_profile_19', 'opponent_profile_20', 'opponent_profile_21', 'opponent_profile_22', 'opponent_profile_23', 'opponent_profile_24', 'opponent_profile_25', 'opponent_profile_26', 'opponent_profile_27', 'opponent_profile_28', 'opponent_profile_29', 'opponent_profile_30']
  , redirect = '/players'
  , formValidate = form(
		field('email').trim().required().isEmail()
	  , field('image').trim()
	  , field('name').trim().required()
	  , field('twitter').trim()
	  , field('facebook').trim()
	  , field('flickr').trim()
	  , field('tumblr').trim()
	  , field('youtube').trim()
	  , field('score').trim().isNumeric()
	  , field('profile_0').trim()
	  , field('profile_1').trim()
	  , field('profile_2').trim()
	  , field('profile_3').trim()
	  , field('profile_4').trim()
	  , field('profile_5').trim()
	  , field('profile_6').trim()
	  , field('opponent_profile_1').trim()
	  , field('opponent_profile_2').trim()
	  , field('opponent_profile_3').trim()
	  , field('opponent_profile_4').trim()
	  , field('opponent_profile_5').trim()
	  , field('opponent_profile_6').trim()
	  , field('opponent_profile_7').trim()
	  , field('opponent_profile_8').trim()
	  , field('opponent_profile_9').trim()
	  , field('opponent_profile_10').trim()
	  , field('opponent_profile_11').trim()
	  , field('opponent_profile_12').trim()
	  , field('opponent_profile_13').trim()
	  , field('opponent_profile_14').trim()
	  , field('opponent_profile_15').trim()
	  , field('opponent_profile_16').trim()
	  , field('opponent_profile_17').trim()
	  , field('opponent_profile_18').trim()
	  , field('opponent_profile_19').trim()
	  , field('opponent_profile_20').trim()
	  , field('opponent_profile_21').trim()
	  , field('opponent_profile_22').trim()
	  , field('opponent_profile_23').trim()
	  , field('opponent_profile_24').trim()
	  , field('opponent_profile_25').trim()
	  , field('opponent_profile_26').trim()
	  , field('opponent_profile_27').trim()
	  , field('opponent_profile_28').trim()
	  , field('opponent_profile_29').trim()
	  , field('opponent_profile_30').trim()
	);

app.get('/players/add', utilities.checkAdmin, utilities.doForm(as, populate, 'Add New Player', Player, template, varNames, redirect));
app.post('/players/add', utilities.checkAdmin, formValidate, utilities.doForm(as, populate, 'Add New Player', Player, template, varNames, redirect));
app.get('/players/edit/:id', utilities.checkAdmin, utilities.doForm(as, populate, 'Edit Player', Player, template, varNames, redirect));
app.post('/players/edit/:id', utilities.checkAdmin, formValidate, utilities.doForm(as, populate, 'Edit Player', Player, template, varNames, redirect));

app.get('/players/generate', utilities.checkAdmin, function(req, res){
	req.flash('error', 'Number of players to generate is required.');
	res.redirect('/players');
	return;
});
app.get('/players/generate/:num', utilities.checkAdmin, function(req, res){
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
app.get('/players/promote/:id', utilities.checkAdmin, function(req, res){
	Player.update({_id: req.params.id}, {$set: {isAdmin: true}}, {}, function(){
		req.flash('info', 'Player Promoted!');
		res.redirect('/players');
	});
});
app.get('/players/demote/:id', utilities.checkAdmin, function(req, res){
	Player.update({_id: req.params.id}, {$set: {isAdmin: false}}, {}, function(){
		req.flash('info', 'Player Demoted!');
		res.redirect('/players');
	});
});
app.get('/players/activate/:id', utilities.checkAdmin, function(req, res){
	Player.findById(req.params.id).run(function(err, player){
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
app.get('/players/deactivate/:id', utilities.checkAdmin, function(req, res){
	Player.findById(req.params.id).run(function(err, player){
		player.active = false;
		player.save();
		player.notifyOfActivation(false, function(){
			util.log('activated: '+util.inspect(arguments));
			req.flash('info', 'Player De-activated!');
			res.redirect('/players');
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
	Player.findById(req.params.id).run(function(err, player){
		Player.find({defending: player.defending, active: true}).desc('score').run(function(err, players){
			res.render('players/leaderboard', {layout: false, players: players, util: util});
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
	Player.findById(req.params.id).run(function(err, player){
		Player.find({defending: player.defending, active: true}).desc('score').run(function(err, players){
			var toHandle = players.length
			  , checkDone = function(){
					if(--toHandle == 0){
						players.sort(function(a, b){
							return b.pointsPerVote - a.pointsPerVote;
						});
						res.render('players/points-per-move-leaderboard', {layout: false, players: players, util: util});
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
	var Vote = mongoose.model('Vote')
	  , d = new Date()
	  , limit = ( d.getDate() - 13 - 21) * 3
	Player.find({active: true}).desc('score').run(function(err, players){
		var toHandle = players.length
		  , checkDone = function(){
				if(--toHandle == 0){
					for(var i=players.length-1; i >= 0; i--){
						if(players[i].voteCount < limit || players[i].voteCount < 2){
							players.splice(i, 1);
						}
					}
					players.sort(function(a, b){
						return b.pointsPerVote - a.pointsPerVote;
					});
					res.render('players/points-per-move-leaderboard', {layout: false, players: players, util: util});
				}
			}
		  , handlePlayer = function(index){
				// Determine number of votes for this player!
				Vote.count({player: players[index]}).where('date').gte(new Date(2012, 5, 21)).run(function(err, voteCount){
					Vote.count({player: players[index], value: 'friend'}).where('date').gte(new Date(2012, 5, 21)).run(function(err, friendCount){
						players[index].friendCount = friendCount;
						players[index].voteCount = voteCount;
						players[index].pointsPerVote = 0;
						if(voteCount > 0){
							players[index].pointsPerVote = (players[index].defending ? players[index].score-10000 : players[index].score) / voteCount;
						}
						checkDone();
					});
				});
			};
		for(var i=0; i<players.length; i++){
			handlePlayer(i);
		}
		return;
	});
});

app.get('/players/import', utilities.checkAdmin, function(req, res){
	res.render('players/import', {title: 'Player import'});
	return;
});
app.post('/players/import', utilities.checkAdmin, function(req, res){
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
			Player.find({email: data[emailColumn]}).run(function(err, players){
				var p = null;
				if(players.length){
					util.log('found exisitng player!');
					p = players[0];
				}else{
					p = new Player();
				}
				for(var i=0; i<data.length; i++){
					if(i < map.length && map[i] && data[i]){
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

app.get('/players/export', utilities.checkAdmin, function(req, res, next){
	var start = Date.now();
	util.log('starting the log up! '+start);
	// Export all game data as a CSV
	var Player = mongoose.model('Player');

/* 	res.contentType('.csv'); */

	var csv = 'player ID\t player name\t player email\t player type\t player score\n';
	
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
			var addToCSV = player._id + '\t ' + player.name + '\t' + player.email + '\t ' + (player.defending ? 'defending' : 'accumulating') + '\t ' + player.score + '\n';
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
	  		var query = Player.find().asc('name');
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

app.get('/players/resetScores/d23bd87', utilities.checkAdmin, function(req, res, next){
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