// Richard Wen
// rrwen.dev@gmail.com

// (packages) Package dependencies
require('dotenv').config();
const pgp = require('pg-promise')();
var fs = require('fs');
var moment = require('moment');
var pgtools = require('pgtools');
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

// (test_connect) Database connection for test database
var connect = {
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
	host: process.env.PGHOST,
	database: 'twitter2pg_database'
};

// (test) Run tests
test('Tests for ' + json.name + ' (' + json.version + ')', t => {
	t.comment('Node.js (' + process.version + ')');
    t.comment('Description: ' + json.description);
    t.comment('Date: ' + moment().format('YYYY-MM-DD hh:mm:ss'));
    t.comment('Dependencies: ' + testedPackages.join(', '));
    t.comment('Developer: ' + devPackages.join(', '));
	
	// (test_admin)  Admin connection to create test database
	var connectAdmin = {
		user: process.env.PGUSER,
		password: process.env.PGPASSWORD,
		port: process.env.PGPORT,
		host: process.env.PGHOST
	};
	
	// (test_db) Create test database
	pgtools.createdb(connectAdmin, 'twitter2pg_database', function (err, res) {
		
		// (test_db_error) Log and exit on test databse creation error
		if (err) {
			throw err;
		}
		
		// (test_db_connect) Connect to test database
		var db = pgp(connect);
		
		// (test_db_tasks) Run tests on test database
		db.task(t => {
			
			// (test_db_table) Create test table
			return t.any('CREATE TABLE twitter2pg_table (tweets jsonb);')
				.then(events => {
					//return t.any('');
				})
				.then(events => {
					//x
				});
		})
			.then(event => {
				
				// (test_db_drop) Drop test database
				pgp.end();
				pgtools.dropdb(connectAdmin, 'twitter2pg_database', function(err, res) {
					if (err) {
						throw err
					};
				});
			})
			.catch(err => {
				
				// (test_fail) Generic failure message under db.task
				t.fail('(MAIN) db.task: ' + err.message);
			});
	});
	
	// (test_pass) Pass a test
	t.pass('(MAIN) test pass');
	
	// (test_equal) Equal test
	var actual = 1;
	var expected = 1;
	t.equal(actual, expected, '(A) Equal test');
	
	// (test_deepequal) Deep equal test
	var actual = {a: 1, b: {c: 2}, d: [3]};
	var expected = {a: 1, b: {c: 2}, d: [3]};
	t.deepEquals(actual, expected, '(B) Deep equal test');
	
	// (test_fail) Fail a test
	//t.fail('(MAIN) test fail');
	
	t.end();
});
