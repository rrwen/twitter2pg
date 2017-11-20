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
var testFile = './tests/log/test_' + json.version.split('.').join('_') + '_stream.txt';
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
		t.pass('(MANUAL) Stream API: Received tweet with ' + Object.keys(data.twitter.tweets).length + ' keys');
		data.twitter.stream.destroy();
		process.exit();
	};

	// (twitter2pg_stream) Stream tweets into PostgreSQL table
	var stream = twitter2pg(options);
	stream.on('error', function(error) {
		t.fail('(MANUAL) Stream API: ' + error.message);
		stream.destroy();
		process.exit();
	});
	t.end();
});
