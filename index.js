// Richard Wen
// rrwen.dev@gmail.com

const {Client, Pool} = require('pg');

var jsonata = require("jsonata");
var Twitter = require('twitter');

/**
 * Extract data from the Twitter Application Programming Interface (API) to a PostgreSQL table.  
 *
 * * {@link https://github.com/rrwen/twitter2pg Github Repository}
 * * {@link https://developer.twitter.com/en/docs Twitter Developer Documentation}
 * * {@link https://developer.twitter.com/en/docs/api-reference-index Twitter API Reference Index}
 * * {@link https://developer.twitter.com/en/docs/tweets/filter-realtime/overview Filter Realtime Tweets}
 *
 * @module twitter2pg
 * @param {Object} [options={}] options for this function.
 * @param {Object} [options.twitter={}] options for {@link https://www.npmjs.com/package/twitter twitter}.
 * @param {Object} [options.twitter.method='get'] Twitter API request method in lowercase letters ('get', 'post', 'delete', or 'stream').
 * @param {Object} [options.twitter.path='search/tweets'] Twitter API endpoint path (such as 'search/tweets' for 'get' or 'statuses/filter' for 'stream').
 * * For REST API endpoints, see {@link https://developer.twitter.com/en/docs/api-reference-index Twitter API Reference Index}
 * * For Streaming endpoints, see {@link https://developer.twitter.com/en/docs/tweets/filter-realtime/overview Filter Realtime Tweets}
 * @param {Object} [options.twitter.params={q:'twitter'}] Twitter API parameters for the `options.twitter.method` and `options.twitter.path`.
 * @param {Object} [options.pg={}] contains options for queries in {@link https://www.npmjs.com/package/pg pg}.
 * @param {string} [options.pg.table='twitter2pg_table'] PostgreSQL table name.
 * @param {string} [options.pg.table='tweets'] PostgreSQL column name for `options.pg.table`.
 * * Column must be a {@link https://www.postgresql.org/docs/9.4/static/datatype-json.html Javascript Object Notation (JSON) type}
 * @param {string} [options.pg.query= 'INSERT INTO $options.pg.table ($options.pg.column) VALUES ($1);'] PostgreSQL parameterized query to insert Twitter data in JSON format.
 * * `$1` is the Twitter data in JSON format
 * @param {Object} [options.stream={}] options for the returned Twitter stream.
 * @param {function} [options.stream.callback=function(err, data){}] callback function on a stream 'data' event.
 * * `data` is in the form of `{stream: ..., tweets: ..., res: ...}`
 * * `data.stream` is the {@link https://www.npmjs.com/package/twitter#streaming-api twitter stream}
 * * `data.tweets` are  the tweets in JSON format
 * * `data.res` is the PostgreSQL {@link https://node-postgres.com/features/queries query results} of `options.pg.query`
 * @returns {(Promise|stream)} Returns a stream if `options.twitter.method` is 'stream', otherwise returns a Promise.
 *
 * @example <caption>Sample tweets.</caption>
 * var x = require('twitter2pg');
 *
 */
module.exports = options => {
	options = options || {};
	
	// (stream_defaults) Default options for streams
	options.stream = options.stream || {};
	options.stream.callback = options.stream.callback || function(err, data){};
	
	// (twitter_defaults) Default options for twitter
	options.twitter = options.twitter || {};
	options.twitter.method = options.twitter.method || 'get';
	options.twitter.path = options.twitter.path || 'search/tweets';
	options.twitter.params = options.twitter.params || {q:'twitter'};
	
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
	options.pg.query = options.pg.query || 'INSERT INTO $options.pg.table ($options.pg.column) VALUES ($1);';
	options.pg.query = options.pg.query.replace('$options.pg.table', options.pg.table);
	options.pg.query = options.pg.query.replace('$options.pg.column', options.pg.column);
	
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
