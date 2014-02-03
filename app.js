process.env.TZ = 'America/New_York';

// Check expected ENV vars
['BASEURL', 'PORT', 'MONGOHQ_URL', 'CLIENT_ID', 'CLIENT_SECRET', 'AUTH_SERVER'].forEach(function(envVar, index){
	if(!process.env[envVar]){
		console.log(envVar+' environment variable is required!');
		process.exit();
	}
})

/**
 * Module dependencies.
 */

var	  newrelic = require('newrelic')
	, http = require('http')
	, express = require('express')
//	, mongooseAuth = require('mongoose-auth')
	, db = require('./db')
	, vm = require('vm')
	, fs = require('fs')
	, mongoose = require('mongoose') 
	, MongoStore = require('connect-mongo')(express)
	, util = require('util')
	, flash = require('connect-flash')
	, auth = require('./auth')
	, moment = require('moment')
	, utilities = require('./utilities')
	, url = require('url');


var app = module.exports = express()
  , port = process.env.PORT
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

io.set('log level', 1); // reduce logging
server.listen(port, function(){
	console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});

utilities.io = io;
io.sockets.on('connection', function (socket) {
	utilities.addSocket(socket);
	socket.on('disconnect', function(){
		utilities.removeSocket(socket);
	});
});

// Models
var dir = __dirname + '/models';
// grab a list of our route files
fs.readdirSync(dir).forEach(function(file){
	require('./models/'+file);
});

// Configuration
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
/* 	app.use(express.compiler({ src: __dirname + '/public', enable: ['less']})); */
	app.use(require('less-middleware')({ src: __dirname + '/public' }));
	app.use(express.static(__dirname + '/public'));

	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: "keyboard cat"
		, store: new MongoStore({
			url: process.env.MONGOHQ_URL
		  , auto_reconnect: true
		})
	}));

//	// mongoose-auth: Step 2
//	app.use(mongooseAuth.middleware(app));
	app.use(flash());
	auth.setup(app);
	
//	app.use(app.router);

//	app.use(express.methodOverride());
	var helpers = require('./helpers')
	  , baseUrl = url.parse(process.env.BASEURL);
	app.locals(helpers.staticHelpers);
	app.use(function(req, res, next){
		// Check BASEURL 
		if(req.host != baseUrl.hostname){
			// Request host doesn't match configured host. Redirect?
			return res.redirect(process.env.BASEURL);
		}
		res.locals.flash = req.flash.bind(req)
		res.locals.moment = moment;
		res.locals.token = req.session.token;
		res.local = function(key, val){
			res.locals[key] = val;
		};
		
		var _BASEURL = process.env.BASEURL;
		var EM_NAV = [
			{
				'name': 'Frenemy Home',
				'link': _BASEURL+'/',
			},
			{
				'name': 'Play!',
				'link': _BASEURL+'/play',
			},
			{
				'name': 'Confess',
				'link': process.env.AUTH_SERVER+'/confess'
			}
		];

		if(req.user && req.user.role >= 10){
			EM_NAV.push({
				'name': 'Games',
				'link': '#',
				'children': [
					{
						'name': 'Active Games',
						'link': _BASEURL+'/games'
					},
					{
						'name': 'Fully-Played Games',
						'link': _BASEURL+'/games/fully-played'
					},
					{
						'name': 'All Games',
						'link': _BASEURL+'/games/all'
					},
					{
						'name': 'Force Start Day',
						'link': _BASEURL+'/games/start'
					},
					{
						'name': 'Force End Day',
						'link': _BASEURL+'/games/end'
					}
				]
			});
			EM_NAV.push({
				'name': 'Players',
				'link': '#',
				'children': [
					{
						'name': 'List Players',
						'link': _BASEURL+'/players'
					},
					{
						'name': 'Add Player',
						'link': _BASEURL+'/players/add'
					},
					{
						'name': 'Import Players',
						'link': _BASEURL+'/players/import'
					}
				]
			});
			EM_NAV.push({
				'name': 'Votes',
				'link': '#',
				'children': [
					{
						'name': 'Export',
						'link': _BASEURL+'/votes/export'
					},
					{
						'name': 'Export All',
						'link': _BASEURL+'/votes/export/all'
					},
					{
						'name': 'Export w/ Score',
						'link': _BASEURL+'/votes/export/score'
					}
				]
			});
		}
		res.locals.nav = EM_NAV;
		next();
	});
	/* app.dynamicHelpers(helpers.dynamicHelpers); */
	var setupHelper = function(key, func){
		console.log('setting up ', key);
		app.use(function(req, res, next){
			res.locals[key] = func.bind(req, res);
			next();
		});
	}
	
	for(var key in helpers.dynamicHelpers){
		setupHelper(key, helpers.dynamicHelpers[key]);
	}
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});


///*
// Routes
auth.route(app);

var dir = __dirname + '/controllers';
// grab a list of our route files
fs.readdirSync(dir).forEach(function(file){
	var str = fs.readFileSync(dir + '/' + file, 'utf8');
	// inject some pseudo globals by evaluating
	// the file with vm.runInNewContext()
	// instead of loading it with require(). require's
	// internals use similar, so dont be afraid of "boot time".
	var context = { app: app, db: db, util: util, require: require, __dirname: __dirname };
	// we have to merge the globals for console, process etc
	for (var key in global) context[key] = global[key];
	// note that this is essentially no different than ... just using
	// global variables, though it's only YOUR code that could influence
	// them, which is a bonus.
	vm.runInNewContext(str, context, file);
});

/*
// mongoose-auth: Step 3
mongooseAuth.helpExpress(app);
*/