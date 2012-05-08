var form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Player = mongoose.model('Player');

app.get('/players', function(req, res){
	Player.find({}).asc('name').run(function(err, players){
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

app.get('/players/add', utilities.doForm(as, populate, 'Add New Player', Player, template, varNames, redirect));
app.post('/players/add', formValidate, utilities.doForm(as, populate, 'Add New Player', Player, template, varNames, redirect));
app.get('/players/edit/:id', utilities.doForm(as, populate, 'Edit Player', Player, template, varNames, redirect));
app.post('/players/edit/:id', formValidate, utilities.doForm(as, populate, 'Edit Player', Player, template, varNames, redirect));