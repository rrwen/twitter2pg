// Richard Wen
// rrwen.dev@gmail.com

const {Client, Pool} = require('pg');

var twitter2return = require('twitter2return');

/**
 * Extract data from the Twitter Application Programming Interface (API) to a PostgreSQL table.  
 *
 * * {@link https://www.postgresql.org/docs/current/static/ PostgreSQL Database Documentation}
 * * {@link https://developer.twitter.com/en/docs Twitter Developer Documentation}
 *
 * @module twitter2pg
 *
 * @param {Object} [options={}] options for this function.
 * @param {Object} [options.twitter={}] options for {@link https://www.npmjs.com/package/twitter twitter} (see {@link https://rrwen.github.io/twitter2return/ twitter2return}).
 *
 * @param {function} [options.twitter.stream=function(err, data){}] callback function on a stream 'data' event for the returned {@link  https://www.npmjs.com/package/twitter#streaming-api Twitter stream}.
 *
 * * `err` is the {@link Error} object
 * * `data` is in the form of `{twitter: {stream: stream, tweets: Object}, pg: {client: Object, results: Object}}`
 * * `data.twitter.stream` is the {@link https://www.npmjs.com/package/twitter#streaming-api twitter stream}
 * * `data.twitter.tweets` are  the {@link https://www.npmjs.com/package/twitter tweets} in JSON format
 * * `data.pg.client` is the PostgreSQL {@link https://node-postgres.com/features/connecting client} from `options.pg.connection`
 * * `data.pg.results` is the PostgreSQL {@link https://node-postgres.com/features/queries query results} of `options.pg.query`
 *
 * @param {Object} [options.pg={}] contains options for queries in {@link https://www.npmjs.com/package/pg pg}.
 * @param {string} [options.pg.table=process.env.PGTABLE || 'twitter2pg_table'] PostgreSQL table name.
 * @param {string} [options.pg.column=process.env.PGCOLUMN || 'tweets'] PostgreSQL column name for `options.pg.table`.
 *
 * * Column must be a {@link https://www.postgresql.org/docs/9.4/static/datatype-json.html Javascript Object Notation (JSON) type}
 *
 * @param {string} [options.pg.query=process.env.PGQUERY || 'INSERT INTO $options.pg.table ($options.pg.column) VALUES ($1);'] PostgreSQL parameterized query to insert Twitter data in JSON format.
 *
 * * `$options.pg.table` is the value set in `options.pg.table`
 * * `$options.pg. column` is the value set in `options.pg.column`
 * * `$1` is the Twitter data in JSON format
 *
 * @param {Object} [options.pg.connection={}] PostgreSQL connection details.
 *
 * @param {string} [options.pg.connection.host=process.env.PGHOST || 'localhost'] **Host** address of PostgreSQL instance.
 * @param {number} [options.pg.connection.port=process.env.PGPORT || 5432] **Port** number of PostgreSQL instance.
 * @param {number} [options.pg.connection.database=process.env.PGDATABASE|| process.env.PGUSER || process.env.USER || 'postgres'] **Database** name for PostgreSQL instance.
 * @param {string} [options.pg.connection.user=process.env.PGUSER || process.env.USER || 'postgres'] **User** name for PostgreSQL instance.
 * @param {string} [options.pg.connection.password=process.env.PGPASSWORD] **Password** of user for PostgreSQL instance.
 *
 * @param {string} [options.jsonata=process.env.JSONATA] {@link https://www.npmjs.com/package/jsonata jsonata} query for the recieved tweet object in JSON format before inserting into the PostgreSQL table (`options.pg.table`).
 *
 * @returns {(Promise|stream)} Returns a stream if `options.twitter.method` is 'stream', otherwise returns a Promise:
 *
 * **If `options.twitter.method` == `'stream'`** 
 *
 * * Return a {@link https://www.npmjs.com/package/twitter#streaming-api Twitter stream}  
 * * `stream.on('data', function)`: calls `function` when a tweet is available  
 * * `stream.on('error', function)`: calls `function` when there is an error  
 *
 * **Else** 
 * 
 * * Return a {@link Promise} object that resolves a `data` object in the form `{twitter: {client: ..., tweets: ...}, pg: {client: ..., results: ...}}`  
 * 
 * * `data.twitter.client`: contains a {@link https://www.npmjs.com/package/twitter Twitter client} object created from `options.twitter.connection`  
 * * `data.twitter.tweets`: contains the {@link https://www.npmjs.com/package/twitter tweets} in JSON format  
 * * `data.pg.client`: contains the PostgreSQL {@link https://node-postgres.com/features/connecting client} from `options.pg.connection`  
 * * `data.pg.results`: contains the PostgreSQL {@link https://node-postgres.com/features/queries query results} of `options.pg.query`  
 *
 * @example 
 *
 * var twitter2pg = require('twitter2pg');
 *
 * // (options) Initialize options object
 * var options = {
 * 	twitter: {},
 * 	pg: {}
 * };
 *
 * // *** CONNECTION SETUP ***
 * 
 * // (options_twitter_connection) Twitter API connection keys
 * options.twitter.connection =  {
 * 	consumer_key: '***',
 * 	consumer_secret: '***',
 * 	access_token_key: '***',
 * 	access_token_secret: '***'
 * };
 *
 * // (options_pg_connection) PostgreSQL connection details
 * options.pg.connection = {
 * 	host: 'localhost',
 * 	port: 5432,
 * 	database: 'postgres',
 * 	user: 'postgres',
 * 	password: '***'
 * };
 *
 * // *** SEARCH TWEETS ***
 *
 * // (options_twitter_rest) Search for keyword 'twitter' in path 'GET search/tweets'
 * options.twitter.method = 'get'; // get, post, or stream
 * options.twitter.path = 'search/tweets'; // api path
 * options.twitter.params = {q: 'twitter'}; // query tweets
 *
 * // (options_pg) PostgreSQL options
 * options.pg.table = 'twitter_data';
 * options.pg.column = 'tweets';
 *	options.pg.query = 'INSERT INTO $options.pg.table($options.pg.column) SELECT * FROM json_array_elements($1);';
 *
 * // (options_jsonata) Filter for statuses array using jsonata
 * options.jsonata = 'statuses';
 *
 * // (twitter2pg_rest) Query tweets using REST API into PostgreSQL table
 * twitter2pg(options)
 * 	.then(data => {
 * 		console.log(data);
 * 	}).catch(err => {
 * 		console.error(err.message);
 * 	});
 *
 * // *** STREAM TWEETS ***
 *
 * // (options_twitter_connection) Track keyword 'twitter' in path 'POST statuses/filter'
 * options.twitter.method = 'stream'; // get, post, or stream
 * options.twitter.path = 'statuses/filter'; // api path
 * options.twitter.params = {track: 'twitter'}; // query tweets
 *
 * // (options_pg) PostgreSQL options
 * options.pg.table = 'twitter_data';
 * options.pg.column = 'tweets';
 *	options.pg.query = 'INSERT INTO $options.pg.table($options.pg.column) VALUES($1);';
 *
 * // (options_jsonata) Remove jsonata filter
 * delete options.jsonata;
 * 
 * // (twitter2pg_stream) Stream tweets into PostgreSQL table
 * var stream = twitter2pg(options);
 * stream.on('error', function(error) {
 * 	console.error(error.message);
 * });
 * 
 */
module.exports = options => {
	options = options || {};
	
	// (pg_defaults) Default options for pg-promise
	options.pg = options.pg || {};
	options.pg.table = options.pg.table || process.env.PGTABLE || 'twitter2pg_table';
	options.pg.column = options.pg.column || process.env.PGCOLUMN || 'tweets';
	options.pg.query = options.pg.query || process.env.PGQUERY || 'INSERT INTO $options.pg.table ($options.pg.column) VALUES ($1);';
	options.pg.query = options.pg.query.replace('$options.pg.table', options.pg.table);
	options.pg.query = options.pg.query.replace('$options.pg.column', options.pg.column);
	
	// (pg_connect) Connection options for pg-promise
	options.pg.connection = options.pg.connection || {};
	if (typeof options.pg.connection == 'string') {
		var pgClient = new Pool({
			connectionString: options.pg.connection
		});
	} else if (!(options.pg.connection instanceof Client || options.pg.connection instanceof Pool)) {
		options.pg.connection.host = options.pg.connection.host || process.env.PGHOST || 'localhost',
		options.pg.connection.port = options.pg.connection.port || process.env.PGPORT || 5432;
		options.pg.connection.database = options.pg.connection.database || process.env.PGDATABASE|| process.env.PGUSER || process.env.USER || 'postgres';
		options.pg.connection.user = options.pg.connection.user  || process.env.PGUSER || process.env.USER || 'postgres';
		options.pg.connection.password = options.pg.connection.password || process.env.PGPASSWORD;
		var pgClient = new Pool(options.pg.connection);
	} else {
		var pgClient = options.pg.connection;
	}
	
	// (twitter_stream) Streaming API
	options.twitter = options.twitter || {};
	options.twitter.method = options.twitter.method || 'get';
	if (options.twitter.method == 'stream') {
		
		// (twitter_stream_pg) Insert tweets as an array
		var streamCallback = options.twitter.stream || function(err, data) {};
		options.twitter.stream = function(err, data) {
			pgClient.query(options.pg.query, [JSON.stringify(data.twitter.tweets)], function(err, res) {
				data.pg = {client: pgClient, results: res};
				streamCallback(err, data);
			});
		};
		
		// (twitter_stream_return) Return twitter stream
		var stream = twitter2return(options);
		return stream;
	} else {
		
		// (twitter_rest) REST API
		return twitter2return(options)
			.then(data => {
				
				// (twitter_promise_return) Return pg promise
				return pgClient.query(options.pg.query, [JSON.stringify(data.twitter.tweets)])
					.then(res => {
						data.pg = {client: pgClient, result: res};
						return data;
					});
			});
	}
};
