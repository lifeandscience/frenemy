var form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Confession = mongoose.model('Confession')
  , moment = require('moment')
  , email = require('./email')
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
  , beforeSave = function(req, res, item){
		// Email to Beck
		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: "Experimonth: Frenemy <experimonth@lifeandscience.org>", // sender address
		    to: 'experimonth+confessional@lifeandscience.org', // list of receivers
		    subject: 'New confession!', // Subject line
		    text: 'New Confessional posted on '+moment(item.date).format('YYYY-MM-DD hh:mm A')+'\n\n---\n\n'+item.text
		};

		// send mail with defined transport object
		email.sendMail(mailOptions, null);
		return item;
	}
  , layout = 'layout-confessional';

app.get('/confessional', utilities.doForm(as, populate, 'Confess!', Confession, template, varNames, redirect, null, null, layout));
app.post('/confessional', formValidate, utilities.doForm(as, populate, 'Confess!', Confession, template, varNames, redirect, null, beforeSave, layout));


app.get('/confessional/thanks', function(req, res){
	res.render('confessions/thanks', {title: 'Your confession has been recorded.', layout: 'layout-confessional'});
});