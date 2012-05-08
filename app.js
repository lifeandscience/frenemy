
/**
 * Module dependencies.
 */

var   express = require('express')
	, mongoose = require('mongoose')
	, vm = require('vm')
	, fs = require('fs')
	, util = require('util');

var app = module.exports = express.createServer();

// Database
var db = process.env.MONGOHQ_URL || 'mongodb://localhost/frenemy';
db = mongoose.connect(db);

// Configuration
app.configure(function(){
	app.set('views', __dirname + '/app/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "keyboard cat" }));
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});

var helpers = require('./helpers');
app.helpers(helpers.staticHelpers);
app.dynamicHelpers(helpers.dynamicHelpers);

// Models
var dir = __dirname + '/app/models';
// grab a list of our route files
fs.readdirSync(dir).forEach(function(file){
	require('./app/models/'+file);
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
	var context = { app: app, db: db, util: util, require: require };
	// we have to merge the globals for console, process etc
	for (var key in global) context[key] = global[key];
	// note that this is essentially no different than ... just using
	// global variables, though it's only YOUR code that could influence
	// them, which is a bonus.
	vm.runInNewContext(str, context, file);
});

var port = process.env.PORT || 3000;
app.listen(port, function(){
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
