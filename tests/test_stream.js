// Richard Wen
// rrwen.dev@gmail.com

require('dotenv').config();
var twitter2pg = require('../index.js');

// (options) Initialize options object
var options = {
	twitter: {},
	pg: {}
};

// (options_twitter_connection) Track keyword 'twitter' in path 'POST statuses/filter'
options.twitter = {
	method: 'stream',
	path: 'statuses/filter',
	params: {track: 'twitter'},
};

// (options_pg) PostgreSQL options
options.pg = {
	table: 'twitter_data',
	column: 'tweets',
	query: 'INSERT INTO $options.pg.table($options.pg.column) VALUES($1);'
};

// options_stream)
options.stream = {};
options.stream.callback = function(err, data) {
	console.log('INSERT tweet with', Object.keys(data.twitter.tweets).length, 'keys to', options.pg.table, '(', options.pg.column, ')');
	data.twitter.stream.destroy();
	process.exit();
};

// (twitter2pg_stream) Stream tweets into PostgreSQL table
var stream = twitter2pg(options);
stream.on('error', function(error) {
	console.error(error.message);
});
