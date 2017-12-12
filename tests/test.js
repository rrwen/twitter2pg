// Richard Wen
// rrwen.dev@gmail.com

// (packages) Package dependencies
require('dotenv').config();
var fs = require('fs');
var moment = require('moment');
var pgtools = require('pgtools');
var test = require('tape');
var twitter2pg = require('../index.js');
const { Client } = require('pg');

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
	
	// (test_create_db) Create test database
	const config = {
		user: process.env.PGUSER,
		password: process.env.PGPASSWORD,
		port: process.env.PGPORT,
		host: process.env.PGHOST
	};
	pgtools.createdb(config, process.env.PGTESTDATABASE, function (err, res) {
		process.env.PGDATABASE = process.env.PGTESTDATABASE;
		const client = new Client();
		
		// (test_create_db_error) Fail to create test database
		if (err) {
			t.fail('(MAIN) CREATE DATABASE: ' + err.message);
			process.exit(-1);
		}
		
		// (test_create_db_pass) Successfully created test database
		t.pass('(MAIN) CREATE DATABASE');
		
		// (test_rest_table) Create REST table for tests
		client.connect();
		client.query('CREATE TABLE twitter2pg_table(tweets jsonb);')
			.then(res => {
				t.comment('(A) tests on REST API');
				t.pass('(A) CREATE TABLE twitter2pg_table');
				
				// (test_rest) Search for keyword 'twitter' in path 'GET search/tweets'
				return twitter2pg({
					twitter: {
						method: 'get',
						path: 'search/tweets',
						params: {q: 'twitter'}
					},
					pg: {
						connection: 'postgres://' + process.env.PGUSER + ':' + process.env.PGPASSWORD + '@' + process.env.PGHOST + ':' + process.env.PGPORT +'/' + process.env.PGDATABASE
					}
				})
					.then(data => {
						
						// (test_rest_pass) REST pass no error
						t.pass('(A) REST GET search/tweets to INSERT twitter2pg_table with defaults');
						data.pg.client.end();
						
					}).catch(err => {
						
						// (test_rest_fail) REST fail if error
						t.fail('(A) REST GET search/tweets to INSERT twitter2pg_table with defaults: ' + err.message);
					});
			})
			.then(data => {
				return client.query('CREATE TABLE twitter2pg_rest(tweets jsonb);')
					.then(res => {
						
						// (test_rest2) Search for keyword 'twitter' in path 'GET search/tweets'
						return twitter2pg({
							twitter: {
								method: 'get',
								path: 'search/tweets',
								params: {q: 'twitter'}
							},
							pg: {
								table: 'twitter2pg_rest',
								query: 'INSERT INTO $options.pg.table($options.pg.column) SELECT * FROM json_array_elements($1);',
								connection: {
									host: process.env.PGHOST,
									port: process.env.PGPORT,
									database: process.env.PGTESTDATABASE,
									user: process.env.PGUSER,
									password: process.env.PGPASSWORD
								}
							},
							jsonata: 'statuses'
						})
							.then(data => {
								
								// (test_rest2_pass) REST pass if consistent with database
								return client.query('SELECT * FROM twitter2pg_rest;')
									.then(res => {
										var actual = data.twitter.tweets;
										var expected = [];
										for (i = 0; i < res.rows.length; i++) {
											expected.push(res.rows[i].tweets)
										}
										t.deepEquals(actual, expected, '(A) REST GET search/tweets to INSERT twitter2pg_rest');
										return data.pg.client.end(err => {
											if (err) {
												t.fail('(A) data.pg.client disconnect: ' + err.message);
											} else {
												t.pass('(A) data.pg.client disconnect')
											}
										});
									})	
							}).catch(err => {
								
								// (test_rest_fail) REST fail if inconsistent with database or error
								t.fail('(A) REST GET search/tweets to INSERT twitter2pg_rest: ' + err.message);
							});
					})
			})
			.then(data => {
				
				// (test_stream_table) Create STREAM table for tests
				return client.query('CREATE TABLE twitter2pg_stream(tweet_stream jsonb);')
					.then(res => {
						t.comment('(B) tests on STREAM API');
						t.pass('(B) CREATE TABLE twitter2pg_stream');
						
						// (test_stream) Track keyword 'twitter' in path 'POST statuses/filter'
						var stream = twitter2pg({
							twitter: {
								method: 'stream',
								path: 'statuses/filter',
								params: '{"track": "twitter"}'
							},
							pg: {
								table: 'twitter2pg_stream',
								column: 'tweet_stream',
								connection: client
							}
						});
						
						// (test_stream_pass) STREAM pass if consistent with database
						stream.on('data', tweets => {
							client.query('SELECT * FROM twitter2pg_stream;')
								.then(res => {
									var actual = tweets;
									var expected = res.rows[0].tweet_stream;
									t.deepEquals(actual, expected, '(B) STREAM POST statuses/filter to INSERT twitter2pg_stream');
									
									// (test_client_end) End pg client connection
									client.end(err => {
										
										// (test_client_end_fail) Fail to end client connection
										if (err) {
											t.fail('(MAIN) client disconnect: ' + err.message);
											process.exit(1);
										}
										
										// (test_client_end_pass) Client successfully disconnected
										t.pass('(MAIN) client disconnect');
										stream.destroy();
										
										// (test_drop_db) Drop test databases
										pgtools.dropdb(config, process.env.PGTESTDATABASE, function (err, res) {

											// (test_drop_db_error) Fail to drop test database
											if (err) {
												t.fail('(MAIN) DROP DATABASE: ' + err.message);
												process.exit(-1);
											}
											
											// (test_drop_pass) Successfully dropped test database
											t.pass('(MAIN) DROP DATABASE');
										});
									});
								})
								.catch(err => {
									console.log(data);
									//t.fail('(B) STREAM POST statuses/filter to INSERT twitter2pg_stream: ' + err.message);
								});
						});
						
						// (test_stream_fail) STREAM fail if inconsistent with database or error
						stream.on('error', error => {
							t.fail('(B) STREAM POST statuses/filter to INSERT twitter2pg_stream: ' + error.message);
							
							// (test_client_end) End pg client connection
							client.end(err => {
								
								// (test_client_end_fail) Fail to end client connection
								if (err) {
									t.fail('(MAIN) client disconnect: ' + err.message);
									process.exit(1);
								}
								
								// (test_client_end_pass) Client successfully disconnected
								t.pass('(MAIN) client disconnect');
								stream.destroy();
								
								// (test_drop_db) Drop test databases
								pgtools.dropdb(config, process.env.PGTESTDATABASE, function (err, res) {

									// (test_drop_db_error) Fail to drop test database
									if (err) {
										t.fail('(MAIN) DROP DATABASE: ' + err.message);
										process.exit(-1);
									}
									
									// (test_drop_pass) Successfully dropped test database
									t.pass('(MAIN) DROP DATABASE');
								});
							});
						});
					})
					.catch(err => {
						t.fail('(B) CREATE TABLE twitter2pg_stream: ' + err.message);
					});
			})
			.catch(err => {
				t.fail('(A) CREATE TABLE twitter2pg_table: ' + err.message);
			});
		t.end();
	});
	
});
