var form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Player = mongoose.model('Player');

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
  , varNames = ['name', 'email', 'score']
  , redirect = '/players'
  , formValidate = form(
		field('name').trim().required()
	  , field('email').trim().required().isEmail()
	  , field('score').trim().isNumeric()
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
		util.log('did update players: '+util.inspect(arguments));
		req.flash('info', 'Player Promoted!');
		res.redirect('/players');
	});
});
app.get('/players/demote/:id', utilities.checkAdmin, function(req, res){
	Player.update({_id: req.params.id}, {$set: {isAdmin: false}}, {}, function(){
		util.log('did update players: '+util.inspect(arguments));
		req.flash('info', 'Player Demoted!');
		res.redirect('/players');
	});
});