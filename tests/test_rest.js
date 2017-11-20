// Richard Wen
// rrwen.dev@gmail.com

// (packages) Package dependencies
require('dotenv').config();
var fs = require('fs');
var moment = require('moment');
var pg = require('pg');
var pgtestdb = require('pg-testdb');
var test = require('tape');
var twitter2pg = require('../index.js');

// (test_info) Get package metadata
var json = JSON.parse(fs.readFileSync('package.json', 'utf8'));
var testedPackages = [];
for (var k in json.dependencies) {
  testedPackages.push(k + ' (' + json.dependencies[k] + ')');
}
var devPackages = [];
for (var k in json.devDependencies) {
  devPackages.push(k + ' (' + json.devDependencies[k] + ')');
}

// (test_log) Pipe tests to file and output
if (!fs.existsSync('./tests/log')){
    fs.mkdirSync('./tests/log');
}
var testFile = './tests/log/test_' + json.version.split('.').join('_') + '_rest.txt';
test.createStream().pipe(fs.createWriteStream(testFile));
test.createStream().pipe(process.stdout);

// (connect) Create postgres connection
const {Pool} = require('pg');
const pool = new Pool({
	host: process.env.PGHOST || 'localhost',
	port: process.env.PGPORT || 5432,
	database: process.env.PGDATABASE || 'postgres',
	user: process.env.PGUSER || 'postgres',
	password: process.env.PGPASSWORD
});

// (test) Run tests
test('Tests for ' + json.name + ' (' + json.version + ')', t => {
	t.comment('Node.js (' + process.version + ')');
    t.comment('Description: ' + json.description);
    t.comment('Date: ' + moment().format('YYYY-MM-DD hh:mm:ss'));
    t.comment('Dependencies: ' + testedPackages.join(', '));
    t.comment('Developer: ' + devPackages.join(', '));
	
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
		table: 'twitter_rest',
		column: 'tweets',
		query: 'INSERT INTO $options.pg.table($options.pg.column) SELECT * FROM json_array_elements($1);'
	};

	// (twitter2pg_rest) Query tweets using REST API into PostgreSQL table
	twitter2pg(options)
		.then(data => {
			t.pass('(MANUAL) REST API: ' + 'Received ' + data.twitter.tweets.length + ' tweets');
			pool.query('SELECT * FROM twitter_rest;')
				.then(res => {
					var actual = data.twitter.tweets;
					var expected = [];
					for (var i = 0; i < res.rows.length; i++) {
						expected.push(res.rows[i].tweets);
					}
					t.deepEquals(actual, expected, '(MANUAL) GET search/tweets to INSERT statuses as json_array_elements');
					data.pg.client.end();
					pool.end();
					process.exit();
				})
				.catch(err => {
					t.fail('(MAIN) GET search/tweets to INSERT statuses as json_array_elements: ' + err.message);
					data.pg.client.end();
					pool.end();
					process.exit();
				});
		}).catch(err => {
			t.fail('(MANUAL) REST API: ' + err.message);
			data.pg.client.end();
			pool.end();
			process.exit();
		});
	t.end();
});
