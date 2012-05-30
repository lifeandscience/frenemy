var form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Player = mongoose.model('Player')
  , csv = require('csv')
  , util = require('util');

app.get('/players', utilities.checkAdmin, function(req, res){
	Player.find({}).asc('name').run(function(err, players){
		res.render('players/index', {title: 'All Players', players: players});
	});
});

app.get('/players/defending', utilities.checkAdmin, function(req, res){
	Player.find({defending:true}).asc('name').run(function(err, players){
		res.render('players/index', {title: 'All Players', players: players});
	});
});
app.get('/players/nondefending', utilities.checkAdmin, function(req, res){
	Player.find({defending:false}).asc('name').run(function(err, players){
		res.render('players/index', {title: 'All Players', players: players});
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
		Player.find({defending: player.defending}).desc('score').run(function(err, players){
			res.render('players/leaderboard', {layout: false, players: players, util: util});
			return;
		});
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