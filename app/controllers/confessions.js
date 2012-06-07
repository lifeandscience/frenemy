var form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Confession = mongoose.model('Confession')
  , moment = require('moment')
  , util = require('util');

app.get('/confessions', utilities.checkAdmin, function(req, res){
	Confession.find({}).asc('date').run(function(err, confessions){
		res.render('confessions/index', {title: 'All Confessions', confessions: confessions, moment: moment});
	});
});

// (as, populate, title, object, template, varNames, redirect, beforeRender, beforeSave)
var as = 'confession'
  , populate = []
  , template = 'confessions/form'
  , varNames = ['text']
  , redirect = '/confessional/thanks'
  , formValidate = form(
		field('text').trim().required()
	)
  , layout = 'layout-confessional';

app.get('/confessional', utilities.doForm(as, populate, 'Confess!', Confession, template, varNames, redirect, null, null, layout));
app.post('/confessional', formValidate, utilities.doForm(as, populate, 'Confess!', Confession, template, varNames, redirect, null, null, layout));


app.get('/confessional/thanks', utilities.checkAdmin, function(req, res){
	res.render('confessions/thanks', {title: 'Thanks for your confession!', layout: 'layout-confessional'});
});