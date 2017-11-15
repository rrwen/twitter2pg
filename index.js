// Richard Wen
// rrwen.dev@gmail.com

const {Client, Pool} = require('pg');

var jsonata = require("jsonata");
var Twitter = require('twitter');

module.exports = options => {
	options = options || {};
	
	// (stream_defaults) Default options for streams
	options.stream = options.stream || {};
	options.stream.callback = options.stream.callback || function(){};
	
	// (twitter_defaults) Default options for twitter
	options.twitter = options.twitter || {};
	options.twitter.method = options.twitter.method || 'get';
	options.twitter.path = options.twitter.path || 'search/tweets';
	options.twitter.params = options.twitter.params || {};
	
	// (twitter_connect) Connection options for twitter
	options.twitter.connection = options.twitter.connection || {};
	options.twitter.connection.consumer_key = options.twitter.connection.consumer_key || process.env.TWITTER_CONSUMER_KEY;
	options.twitter.connection.consumer_secret = options.twitter.connection.consumer_secret || process.env.TWITTER_CONSUMER_SECRET;
	options.twitter.connection.access_token_key = options.twitter.connection.access_token_key || process.env.TWITTER_ACCESS_TOKEN_KEY;
	options.twitter.connection.access_token_secret = options.twitter.connection.access_token_secret || process.env.TWITTER_ACCESS_TOKEN_SECRET;
	options.twitter.connection.bearer_token = options.twitter.connection.bearer_token || process.env.TWITTER_BEARER_TOKEN;
	var client = new Twitter(options.twitter.connection);
	
	// (pg_defaults) Default options for pg-promise
	options.pg = options.pg || {};
	options.pg.table = options.pg.table || 'twitter2pg_table';
	options.pg.column = options.pg.column || 'tweets';
	options.pg.query = options.pg.query || 'INSERT INTO ' + options.pg.table + '(' + options.pg.column + ') VALUES ($1);';
	
	// (pg_connect) Connection options for pg-promise
	options.pg.connection = options.pg.connection || {};
	if (typeof options.pg.connection == 'string') {
		var pgClient = new Pool({
			connectionString: options.pg.connection
		});
		pgClient.connect();
	} else if (!(options.pg.connection instanceof Client || options.pg.connection instanceof Pool)) {
		options.pg.connection.host = options.pg.connection.host || process.env.PGHOST || 'localhost',
		options.pg.connection.port = options.pg.connection.port || process.env.PGPORT || 5432;
		options.pg.connection.database = options.pg.connection.database || process.env.PGDATABASE|| process.env.USER || 'postgres';
		options.pg.connection.user = options.pg.connection.user  || process.env.PGUSER || process.env.USER || 'postgres';
		options.pg.connection.password = options.pg.connection.password || process.env.PGPASSWORD;
		var pgClient = new Pool(options.pg.connection);
		pgClient.connect();
	} else {
		var pgClient = options.pg.connection;
	}
	
	// (twitter_stream) Streaming API
	if (options.twitter.method == 'stream') {
		var stream = client[options.twitter.method](options.twitter.path, options.twitter.params);
		stream.on('data', function(tweets) {
			
			// (twitter_stream_jsonata) Filter tweets using jsonata syntax
			if (options.jsonata) {
				tweets = jsonata(options.jsonata).evaluate(tweets);
			}
			
			// (twitter_stream_pg) Insert tweets as an array
			pgClient.query(options.pg.query, [JSON.stringify(tweets)], function(err, res) {
				var data = {stream: stream, tweets: tweets, res: res};
				options.stream.callback(err, data);
			});
		});
		return stream;
	} else {
		
		// (twitter_rest) REST API
		return client[options.twitter.method](options.twitter.path, options.twitter.params)
			.then(tweets => {
				
				// (twitter_rest_jsonata) Filter tweets using jsonata syntax
				if (options.jsonata) {
					tweets = jsonata(options.jsonata).evaluate(tweets);
				}
				
				// (twitter_rest_pg) Insert tweets into pg
				return pgClient.query(options.pg.query, [JSON.stringify(tweets)])
					.then(res => {
						return {tweets: tweets, res: res};
					});
			});
	}
};
