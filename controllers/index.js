var util = require('util')
  , less = require('less');

app.get('/', function(req, res){
	res.render('index', {title: 'Welcome to Frenemy!', util: util});
});
app.get('/login', function(req, res){
	res.redirect('/auth/facebook');
	return;
});