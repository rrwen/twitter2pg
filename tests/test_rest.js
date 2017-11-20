// Richard Wen
// rrwen.dev@gmail.com

// (packages) Package dependencies
require('dotenv').config();
var fs = require('fs');
var moment = require('moment');
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

// (test_db) Define a test database
var options = {
	testdb: 'twitter2pg_database', 
	messages: false
};

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
		table: 'twitter_data',
		column: 'tweets',
		query: 'INSERT INTO $options.pg.table($options.pg.column) SELECT * FROM json_array_elements($1);'
	};

	// (twitter2pg_rest) Query tweets using REST API into PostgreSQL table
	twitter2pg(options)
		.then(data => {
			data.pg.client.end();
			t.pass('(MANUAL) REST API: ' + 'Received ' + data.twitter.tweets.length + ' tweets');
			process.exit();
		}).catch(err => {
			data.pg.client.end();
			t.fail('(MANUAL) REST API: ' + err.message);
			process.exit();
		});
	t.end();
});
