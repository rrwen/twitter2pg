// Richard Wen
// rrwen.dev@gmail.com

var jsonata = require("jsonata");
var Twitter = require('twitter');

module.exports = function(options) {
	options = options || {};
	
	// (twitter_defaults) Default options for twitter
	options.twitter = options.twitter || {};
	options.twitter.method = options.twitter.method || 'get';
	options.twitter.path = options.twitter.path || 'search/tweets';
	options.twitter.params = options.twitter.params || {};
	options.twitter.callback = options.twitter.callback || function(){};
	
	// (twitter_connect) Connection options for twitter
	options.twitter.connection = options.twitter.connection || {};
	options.twitter.connection.consumer_key = options.twitter.connection.consumer_key || process.env.TWITTER_CONSUMER_KEY;
	options.twitter.connection.consumer_secret = options.twitter.connection.consumer_secret || process.env.TWITTER_CONSUMER_SECRET;
	options.twitter.connection.access_token_key = options.twitter.connection.access_token_key || process.env.TWITTER_ACCESS_TOKEN_KEY;
	options.twitter.connection.access_token_secret = options.twitter.connection.access_token_secret || process.env.TWITTER_ACCESS_TOKEN_SECRET;
	options.twitter.connection.bearer_token = options.twitter.connection.bearer_token || process.env.TWITTER_BEARER_TOKEN;
	
	// (pgp_defaults) Default options for pg-promise
	options.pgp = options.pgp || {};
	options.pgp.initOptions = options.pgp.initOptions || {};
	options.pgp.table = options.pgp.table || 'twitter2pg';
	options.pgp.column = options.pgp.column || 'tweets';
	options.pgp.query = options.pgp.query || 'INSERT INTO ' + options.pgp.table + '(' + options.pgp.column + ') VALUES ($1);';
	options.pgp.callback = options.pgp.callback || function(){};
	
	// (pgp_connect) Connection options for pg-promise
	options.pgp.connection = options.pgp.connection || {};
	options.pgp.connection.host = options.pgp.connection.host || process.env.PGHOST || 'localhost',
    options.pgp.connection.port = options.pgp.connection.port || process.env.PGPORT || 5432;
    options.pgp.connection.database = options.pgp.connection.database || process.env.PGDATABASE|| process.env.USER || 'postgres';
    options.pgp.connection.user = options.pgp.connection.user  || process.env.PGUSER || process.env.USER || 'postgres';
    options.pgp.connection.password = options.pgp.connection.password || process.env.PGPASSWORD;
	
	// (connect) Connect to twitter and pgp
	var client = new Twitter(options.twitter.connection);
	const pgp = require('pg-promise')(options.pgp.initOptions);
	const db = db.pgp(options.pgp.connection);
	
	// (twitter_stream) Streaming API
	if (options.twitter.method == 'stream') {
		var stream = client[options.twitter.method](options.twitter.path, options.twitter.params);
		stream.on('data', function(tweets) {
			
			// (twitter_stream_jsonata) Filter tweets using jsonata syntax
			if (options.jsonata) {
				tweets = jsonata(options.jsonata).evaluate(tweets);
			}
			
			// (twitter_stream_pgp) Insert tweets as an array
			db.one(options.pgp.query, tweets, options.pgp.callback);
		});
		options.twitter.callback(stream);
	} else {
		
		// (twitter_rest) REST API
		client[options.twitter.method](options.twitter.path, options.twitter.params, function(err, tweets, response) {
			options.twitter.callback(err, tweets, response);
			
			// (twitter_rest_jsonata) Filter tweets using jsonata syntax
			if (options.jsonata) {
				tweets = jsonata(options.jsonata).evaluate(tweets);
			}
			
			// (twitter_rest_pgp) Insert tweets as an array
			db.any(options.pgp.query, tweets, options.pgp.callback);
		});
	}
};
