var util = require('util')
  , auth = require('./auth')
  , moment = require('moment')
  , form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Game = mongoose.model('Game')
  , Player = mongoose.model('Player')
  , ProfileQuestion = mongoose.model('ProfileQuestion')
  , ProfileAnswer = mongoose.model('ProfileAnswer');

app.get('/profile', auth.authorize(1, 0, null, true), function(req, res){
	return res.render('profile', {title: 'Your Profile', theuser: util.inspect(req.session.player), experimonths: [], questions: [], answers: [], games: []});

	// TODO: This throws an erorr as Experimonth isn't defined; Look in the user's profile for their experimonths?
	Experimonth.find({_id: {$in: req.session.player.experimonths}}).exec(function(err, experimonths){
		Game.find({_id: {$in: req.session.player.games}}).exec(function(err, games){
			console.log('finding games:', err, games);
			ProfileAnswer.find({player: req.session.player._id}).populate('question').exec(function(err, answers){
				var questions = [];
				for(var i=0; i<answers.length; i++){
					questions.push(answers[i].question._id);
				}
				ProfileQuestion.find({published: true, _id: {$not: {$in: questions}}}).exec(function(err, questions){
					res.render('profile', {title: 'Your Profile', theuser: util.inspect(req.session.player), experimonths: experimonths, questions: questions, answers: answers, games: games});
				});
			});
		});
	});
});