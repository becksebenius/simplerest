var express = require('express');
var bodyParser = require('body-parser')

var rest_server = function () {
	var app = express();
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({
		extended: true
	}))
	app.use(bodyParser.text());

	this.express = app;
}

rest_server.prototype.onPost = function (api, options, callback){
	var self = this;

	if(typeof(options) == 'function') {
		callback = options;
		options = {};
	}

	log_api_init ("POST: " + api, options)

	self.express.post(api, function(req, res){
		try {

			var context = setup_context(req, res);

			if(!auth_req(self, context, options)) return;

			callback(context);

		} catch(err) {
			handle_error(err, res)
		}
	})
}

rest_server.prototype.onGet = function (api, options, callback){
	var self = this;
	
	if(typeof(options) == 'function') {
		callback = options;
		options = {};
	}

	log_api_init ("GET: " + api, options)

	self.express.get(api, function(req, res){
		try {
			
			var context = setup_context(req, res);

			if(!auth_req(self, context, options)) return;

			callback(context);

		} catch(err) {

			handle_error(err, res)

		}
	})
}

rest_server.prototype.start = function (port) {
	var self = this;

	var server = self.express.listen(port, function () {
	  var host = server.address().address
	  var port = server.address().port

	  console.log("Starting server at host " + host + ":" + port);
	})
	return server;
}

function get_error_info (err) {
	var errString;
	var errCode = -1
	var errStack;

	if(err instanceof Error) {
		errString = err.message;
		errStack = err.stack;
	}
	else if(typeof err == 'string') {
		errString = err;
		errStack = "unknown"
	}
	else {
		errString = JSON.stringify(err)
		errStack = "unknown"
	}

	return {
		code: errCode,
		message: errString,
		stack: errStack
	};
}

function handle_error (err, res){
	var retVal = JSON.stringify(get_error_info(err));

	console.log(retVal)
	res.status(500).end(retVal)
}

function setup_context (req, res){
	var context = { "request": req, "result": res }
	res.error = function(err){
		handle_error(err, res)
	}
	res.success = function(result){
		res.status(200).end(result)
	}
	return context;
}

function auth_req (simplerest, context, options) {
	// No app key required
	if(!simplerest.app_key)
	{
		return true;
	}

	if(!options.ignore_authkey){
		var hAppKey = context.request.get('Application-Key');
		if(hAppKey == null){
			context.result.error('Application-Key not provided')
			return false;
		} else if(hAppKey != simplerest.app_key){
			context.result.error('Application-Key was incorrect');
			return false;
		}
	}

	return true;
}

function log_api_init (api_message, options){
	console.log(api_message);
}

module.exports = rest_server