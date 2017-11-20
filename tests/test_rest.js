// Richard Wen
// rrwen.dev@gmail.com

require('dotenv').config();
var twitter2pg = require('../index.js');

// (options) Initialize options object
var options = {
	twitter: {},
	pg: {},
	jsonata: 'statuses' // filter tweets
};

// (options_twitter_rest) Search for keyword 'twitter' in path 'GET search/tweets'
options.twitter = {
	method: 'get', // get, post, or stream
	path: 'search/tweets', // api path
	params: {q: 'twitter'} // query tweets
};

// (options_pg) PostgreSQL options
options.pg = {
	table: 'twitter_data',
	column: 'tweets',
	query: 'INSERT INTO $options.pg.table($options.pg.column) SELECT * FROM json_array_elements($1);'
};

// (twitter2pg_rest) Query tweets using REST API into PostgreSQL table
twitter2pg(options)
	.then(data => {
		data.pg.client.end();
		console.log('INSERT', data.twitter.tweets.length, 'tweets to', options.pg.table, '(', options.pg.column, ')');
		process.exit();
	}).catch(err => {
		console.error(err.message);
	});
