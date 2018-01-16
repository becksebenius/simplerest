var express = require('express');
var app = express();

var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(bodyParser.text());
app.set('view engine', 'jade')

var app_key = '0108e2e1-4b74-421f-a430-d184d0143cfe';

var rest_server = function () {

}

rest_server.prototype.onPost = function (api, options, callback){
	if(typeof(options) == 'function') {
		callback = options;
		options = {};
	}

	log_api_init ("POST: " + api, options)

	app.post(api, function(req, res){
		try {

			var context = setup_context(req, res);

			if(!auth_req(context, options)) return;

			callback(context);

		} catch(err) {
			handle_error(err, res)
		}
	})
}

rest_server.prototype.onGet = function (api, options, callback){
	if(typeof(options) == 'function') {
		callback = options;
		options = {};
	}

	log_api_init ("GET: " + api, options)

	app.get(api, function(req, res){
		try {
			
			var context = setup_context(req, res);

			if(!auth_req(context, options)) return;

			callback(context);

		} catch(err) {

			handle_error(err, res)

		}
	})
}

rest_server.prototype.admin = function(api, options, callback){
	if(typeof(options) == 'function') {
		callback = options;
		options = {}
	}

	// admin requests do not require the auth key
	options.ignore_authkey = true;

	// all admin pages live in the admin subdirectory
	api = '/admin' + api;

	log_api_init ("ADMIN: " + api, options)

	app.get(api, function(req, res){
		try {

			var context = setup_context(req, res);

			// admin panel displays error by rendering
			context.result.error = function(err){
				var error_info = get_error_info(err);
				context.result.render('generic_message', {
					title: "Error",
					message: "<b>Error " + err.code + " occured:<br/></b>" + err.message + "<br/><b>Stack:</b><br/>" + err.stack
				})
			}

			if(!auth_req(context, options)) return;

			try {
				callback(context);
			} catch (err) {
				context.result.error(err);
			}
		} catch (err) {

			handle_error(err, res);

		}
	})
}

rest_server.prototype.start = function () {
	var server = app.listen(8081, function () {
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

function auth_req (context, options) {
	if(!options.ignore_authkey){
		var hAppKey = context.request.get('Application-Key');
		if(hAppKey == null){
			context.result.error('Application-Key not provided')
			return false;
		} else if(hAppKey != app_key){
			context.result.error('Application-Key was incorrect');
			return false;
		}
	}

	return true;
}

function log_api_init (api_message, options){
	console.log(api_message);
	// console.log(JSON.stringify(options, null, 1))
	// console.log('');
}

module.exports = rest_server