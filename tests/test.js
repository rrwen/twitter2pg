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
var testFile = './tests/log/test_' + json.version.split('.').join('_') + '.txt';
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
	
	// (test_functions) Define test functions
	options.tests = [

		// (a_test_get_search_singlerow) Insert searched tweets as one row
		client => {
			t.comment('(A) tests on Twitter REST API');
			client.connect();
			return client.query('CREATE TABLE twitter2pg_get_search_singlerow(tweets jsonb);')
				.then(() => {
					return twitter2pg({
						twitter: {
							method: 'get',
							path: 'search/tweets',
							params: {q: 'twitter'}
						},
						pg: {
							table: 'twitter2pg_get_search_singlerow',
							column: 'tweets',
							query: 'INSERT INTO $options.pg.table($options.pg.column) VALUES ($1);',
							connection: client
						}
					})
						.then(data => {
							return client.query('SELECT * FROM twitter2pg_get_search_singlerow;')
								.then(res => {
									var actual = data.twitter.tweets;
									var expected = res.rows[0].tweets;
									t.deepEquals(actual, expected, '(A) GET search/tweets to INSERT VALUES');
								});
						});
				})
				.catch(err => {
					t.fail('(A) GET search/tweets to INSERT VALUES: ' + err.message);
				});
		},
		
		// (a_test_get_search_multirow) Insert searched tweets as multiple rows
		client => {
			return client.query('CREATE TABLE twitter2pg_get_search_multirow(tweets jsonb);')
				.then(() => {
					return twitter2pg({
						twitter: {
							method: 'get',
							path: 'search/tweets',
							params: {q: 'twitter'}
						},
						pg: {
							table: 'twitter2pg_get_search_multirow',
							column: 'tweets',
							query: 'INSERT INTO $options.pg.table($options.pg.column) SELECT * FROM json_array_elements($1);',
							connection: client
						},
						jsonata: 'statuses'
					})
						.then(data => {
							return client.query('SELECT * FROM twitter2pg_get_search_multirow;')
								.then(res => {
									var actual = data.twitter.tweets;
									var expected = [];
									for (var i = 0; i < res.rows.length; i++) {
										expected.push(res.rows[i].tweets);
									}
									t.deepEquals(actual, expected, '(A) GET search/tweets to INSERT statuses as json_array_elements');
								});
						});
				})
				.catch(err => {
					t.fail('(A) GET search/tweets to INSERT statuses as json_array_elements: ' + err.message);
				});
		},
		
		// (a_test_get_favorites) Insert 20 most recently liked tweets as multiple rows
		client => {
			return client.query('CREATE TABLE twitter2pg_get_favorites(tweets jsonb);')
				.then(() => {
					return twitter2pg({
						twitter: {
							method: 'get',
							path: 'favorites/list',
							params: {}
						},
						pg: {
							table: 'twitter2pg_get_favorites',
							column: 'tweets',
							query: 'INSERT INTO $options.pg.table($options.pg.column) VALUES($1);',
							connection: client
						}
					})
						.then(data => {
							return client.query('SELECT * FROM twitter2pg_get_favorites;')
								.then(res => {
									var actual = data.twitter.tweets;
									var expected = res.rows[0].tweets;
									t.deepEquals(actual, expected, '(A) GET favorites/list to INSERT VALUES');
								});
						});
				})
				.catch(err => {
					t.fail('(A) GET favorites/list to INSERT VALUES: ' + err.message);
				});
		},
		
		// (b_test_stream_track_keyword) Create streaming track for keyword twitter
		client => {
			t.comment('(B) tests on Twitter Streaming API');
			return client.query('CREATE TABLE twitter2pg_stream_track_keyword(tweets jsonb);')
				.then(() => {
					var stream = twitter2pg({
						twitter: {
							method: 'stream',
							path: 'statuses/filter',
							params: {track: 'twitter'}
						},
						pg: {
							table: 'twitter2pg_stream_track_keyword',
							column: 'tweets',
							query: 'INSERT INTO $options.pg.table($options.pg.column) VALUES($1);',
							connection: client
						},
						stream: {
							callback: (err, data) => {
								console.log(data);
								data.stream.destroy();
							}
						}
					});
					stream.on('data', function(tweets) {
						t.pass('(B) STREAM statuses/filter with keyword track');
						stream.destroy();
					});
					stream.on('error', function(error) {
						t.fail('(B) STREAM statuses/filter with keyword track: ' + error.message);
						stream.destroy();
					});
				})
				.catch(err => {
					t.fail('(B) STREAM statuses/filter with keyword track: ' + err.message);
				});
		},
		
		// (b_test_stream_locations) Create streaming track for bounding box locations
		client => {
			return client.query('CREATE TABLE twitter2pg_stream_locations(tweets jsonb);')
				.then(() => {
					var stream = twitter2pg({
						twitter: {
							method: 'stream',
							path: 'statuses/filter',
							params: {locations: '-122.75,36.8,-121.75,37.8'} // SW(lon, lat), NE(lon, lat)
						},
						pg: {
							table: 'twitter2pg_stream_locations',
							column: 'tweets',
							query: 'INSERT INTO $options.pg.table($options.pg.column) VALUES($1);',
							connection: client
						},
						stream: {
							callback: (err, data) => {
								console.log(data);
								data.stream.destroy();
							}
						}
					});
					stream.on('data', function(tweets) {
						t.pass('(B) STREAM statuses/filter given locations bounds');
						stream.destroy();
					});
					stream.on('error', function(error) {
						t.fail('(B) STREAM statuses/filter given locations bounds: ' + error.message);
						stream.destroy();
					});
				})
				.catch(err => {
					t.fail('(B) STREAM statuses/filter given locations bounds: ' + err.message);
				});
		}
	];

	// (test_run) Run the tests
	pgtestdb(options, (err, res) => {
		if (err) throw err;
	});
	t.end();
});
