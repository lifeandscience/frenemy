
/**
 * Module dependencies.
 */

var   http = require('http')
	, express = require('express')
	, mongooseAuth = require('mongoose-auth')
	, db = require('./db')
	, vm = require('vm')
	, fs = require('fs')
	, MongoStore = require('connect-mongo')(express)
	, util = require('util')
	, flash = require('connect-flash');


var app = module.exports = express();

// Models
var dir = __dirname + '/app/models';
// grab a list of our route files
fs.readdirSync(dir).forEach(function(file){
	require('./app/models/'+file);
});

// Configuration
app.configure(function(){
	app.set('views', __dirname + '/app/views');
	app.set('view engine', 'jade');
/* 	app.use(express.compiler({ src: __dirname + '/public', enable: ['less']})); */
	app.use(require('less-middleware')({ src: __dirname + '/public' }));
	app.use(express.static(__dirname + '/public'));

	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: "keyboard cat"
	  , store: new MongoStore({
			url: process.env.MONGOHQ_URL || 'mongodb://localhost/frenemy'
		})
	}));

	// mongoose-auth: Step 2
	app.use(mongooseAuth.middleware(app));
	
	app.use(flash());
//	app.use(app.router);

//	app.use(express.methodOverride());
	var helpers = require('./helpers');
	app.locals(helpers.staticHelpers);
	/* app.dynamicHelpers(helpers.dynamicHelpers); */
	for(var key in helpers.dynamicHelpers){
		app.use(function(req, res, next){
			res.locals[key] = helpers.dynamicHelpers[key](req, res);
			next();
		});
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
var dir = __dirname + '/app/controllers';
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

var port = process.env.PORT || 3000;
(http.createServer(app)).listen(port, function(){
	console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});
