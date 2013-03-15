var util = require('util')
  , less = require('less');

app.get('/', function(req, res){
	// Test oAuth
	
	
	
	res.render('index', {title: 'Welcome to Frenemy!', util: util});
});
app.get('/login', function(req, res){
	res.redirect('/auth/facebook');
	return;
});
//app.get('/css/style.css', function(req, res){
//	less.render(__dirname+'/public/css/style.less', function(err, css){
//		res.send(css);
//	});
//});