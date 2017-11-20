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
		table: 'twitter_stream',
		column: 'tweets',
		query: 'INSERT INTO $options.pg.table($options.pg.column) VALUES($1);'
	};

	// options_stream)
	options.stream = {};
	options.stream.callback = function(err, data) {
		t.pass('(MANUAL) Stream API: Received tweet with ' + Object.keys(data.twitter.tweets).length + ' keys');
		pool.query('SELECT * FROM twitter_stream;')
			.then(res => {
				var actual = data.twitter.tweets;
				var expected = res.rows[0].tweets;
				t.deepEquals(actual, expected, '(B) STREAM statuses/filter with keyword track');
				data.twitter.stream.destroy();
				pool.end();
				process.exit();
			})
			.catch(err => {
				t.fail('(B) STREAM statuses/filter with keyword track: ' + err.message);
				data.twitter.stream.destroy();
				pool.end();
				process.exit();
			});
	};

	// (twitter2pg_stream) Stream tweets into PostgreSQL table
	var stream = twitter2pg(options);
	stream.on('error', function(error) {
		t.fail('(MANUAL) Stream API: ' + error.message);
		stream.destroy();
		pool.end();
		process.exit();
	});
	t.end();
});
