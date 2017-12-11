# twitter2pg

Richard Wen  
rrwen.dev@gmail.com  

* [Documentation](https://rrwen.github.io/twitter2pg)

Module for extracting Twitter data to PostgreSQL databases.

[![npm version](https://badge.fury.io/js/twitter2pg.svg)](https://badge.fury.io/js/twitter2pg)
[![Build Status](https://travis-ci.org/rrwen/twitter2pg.svg?branch=master)](https://travis-ci.org/rrwen/twitter2pg)
[![Coverage Status](https://coveralls.io/repos/github/rrwen/twitter2pg/badge.svg?branch=master)](https://coveralls.io/github/rrwen/twitter2pg?branch=master)
[![npm](https://img.shields.io/npm/dt/twitter2pg.svg)](https://www.npmjs.com/package/twitter2pg)
[![GitHub license](https://img.shields.io/github/license/rrwen/twitter2pg.svg)](https://github.com/rrwen/twitter2pg/blob/master/LICENSE)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/rrwen/twitter2pg.svg?style=social)](https://twitter.com/intent/tweet?text=Module%20for%20extracting%20Twitter%20data%20to%20PostgreSQL%20databases:%20https%3A%2F%2Fgithub.com%2Frrwen%2Ftwitter2pg%20%23nodejs%20%23npm)

## Install

1. Install [PostgreSQL](https://www.postgresql.org/)
2. Install [Node.js](https://nodejs.org/en/)
3. Install [twitter2pg](https://www.npmjs.com/package/twitter2pg) via `npm`

```
npm install --save twitter2pg
```

For the latest developer version, see [Developer Install](#developer-install).

## Usage

The usage examples show how to get Twitter data into a PostgreSQL table named `twitter_data` with a `tweets` jsonb column:

row | tweets
--- | ---
1 | {...}
2 | {...}
3 | {...}
... | ...

Create an appropriate PostgreSQL table with [psql](https://www.postgresql.org/docs/current/static/app-psql.html) before running the usage examples:

* `-h`: host address
* `-p`: port number
* `-d`: database name
* `-U`: user name with table creation permissions
* `-c`: PostgreSQL query

```
psql -h localhost -p 5432 -d postgres -U postgres -c "CREATE TABLE twitter_data(tweets jsonb);"
```

### REST API

1. Search for tweets with keyword `twitter` using  a GET request
2. Filter tweets with [jsonata](https://www.npmjs.com/package/jsonata) to only return the array inside `statuses`
3. Insert the filtered tweets into a PostgreSQL table named `twitter_data`
4. Each row of the `tweets` column in the `twitter_data` table contains one tweet

```javascript
var twitter2pg = require('twitter2pg');

options = {
	pg: {},
	twitter: {},
	jsonata: 'statuses' // filter tweets for statuses array only
};

// (options_twitter) Twitter API options
options.twitter = {
	method: 'get', // get, post, delete, or stream
	path: 'search/tweets', // api path
	params: {q: 'twitter'} // query tweets
};

// (options_twitter_connection) Twitter API connection keys
options.twitter.connection =  {
	consumer_key: '***', // default: process.env.TWITTER_CONSUMER_KEY
	consumer_secret: '***', // default: process.env.TWITTER_CONSUMER_SECRET
	access_token_key: '***', // default: process.env.TWITTER_ACCESS_TOKEN_KEY
	access_token_secret: '***' // default: process.env.TWITTER_ACCESS_TOKEN_SECRET
};

// (options_pg) PostgreSQL options
// In query, $1 are the JSON tweets
options.pg = {
	table: 'twitter_data',
	column: 'tweets',
	query: 'INSERT INTO $options.pg.table($options.pg.column) SELECT * FROM json_array_elements($1);'
};

// (options_pg_connection) PostgreSQL connection details
options.pg.connection = {
	host: 'localhost', // default: process.env.PGHOST
	port: 5432, // default: process.env.PGPORT
	database: 'postgres', // default: process.env.PGDATABASE
	user: 'postgres', // default: process.env.PGUSER
	password: '***' // default: process.env.PGPASSWORD
};

// (twitter2pg_rest) Query tweets using REST API into PostgreSQL table
twitter2pg(options).catch(err => {
	console.error(err.message);
});
```

### Stream API

1. Stream tweets to track keyword `twitter`
2. When a tweet is available, insert the tweet into a PostgreSQL table named `twitter_data`
3. Each tweet is inserted as one row in the `tweets` column of the `twitter_data` table

```javascript
var twitter2pg = require('twitter2pg');

options = {};

// (options_twitter) Twitter API options
options.twitter = {
	method: 'stream', // get, post, delete, or stream
	path: 'statuses/filter',// api path
	params: {track: 'twitter'} // track tweets
};

// (options_twitter_connection) Twitter API connection keys
options.twitter.connection =  {
	consumer_key: '***', // default: process.env.TWITTER_CONSUMER_KEY
	consumer_secret: '***', // default: process.env.TWITTER_CONSUMER_SECRET
	access_token_key: '***', // default: process.env.TWITTER_ACCESS_TOKEN_KEY
	access_token_secret: '***' // default: process.env.TWITTER_ACCESS_TOKEN_SECRET
};

// (options_pg) PostgreSQL options
// In query, $1 are the JSON tweets
options.pg = {
	table: 'twitter_data',
	column: 'tweets',
	query: 'INSERT INTO $options.pg.table($options.pg.column) VALUES($1);'
};

// (options_pg_connection) PostgreSQL connection details
options.pg.connection = {
	host: 'localhost', // default: process.env.PGHOST
	port: 5432, // default: process.env.PGPORT
	database: 'postgres', // default: process.env.PGDATABASE
	user: 'postgres', // default: process.env.PGUSER
	password: '***' // default: process.env.PGPASSWORD
};

// (twitter2pg_stream) Stream tweets into PostgreSQL table
var stream = twitter2pg(options);
stream.on('error', function(error) {
	console.error(error.message);
});
```

See [Documentation](https://rrwen.github.io/twitter2pg) for more details.

## Contributions

### Report Contributions

Reports for issues and suggestions can be made using the [issue submission](https://github.com/rrwen/twitter2pg/issues) interface.

When possible, ensure that your submission is:

* **Descriptive**: has informative title, explanations, and screenshots
* **Specific**: has details of environment (such as operating system and hardware) and software used
* **Reproducible**: has steps, code, and examples to reproduce the issue

### Code Contributions

Code contributions are submitted via [pull requests](https://help.github.com/articles/about-pull-requests/):

1. Ensure that you pass the [Tests](#tests)
2. Create a new [pull request](https://github.com/rrwen/twitter2pg/pulls)
3. Provide an explanation of the changes

A template of the code contribution explanation is provided below:

```
## Purpose

The purpose can mention goals that include fixes to bugs, addition of features, and other improvements, etc.

## Description

The description is a short summary of the changes made such as improved speeds or features, and implementation details.

## Changes

The changes are a list of general edits made to the files and their respective components.
* `file_path1`:
    * `function_module_etc`: changed loop to map
    * `function_module_etc`: changed variable value
* `file_path2`:
    * `function_module_etc`: changed loop to map
    * `function_module_etc`: changed variable value

## Notes

The notes provide any additional text that do not fit into the above sections.
```

For more information, see [Developer Install](#developer-install) and [Implementation](#implementation).

## Developer Notes

### Developer Install

Install the latest developer version with `npm` from github:

```
npm install git+https://github.com/rrwen/twitter2pg
```
  
Install from `git` cloned source:

1. Ensure [git](https://git-scm.com/) is installed
2. Clone into current path
3. Install via `npm`

```
git clone https://github.com/rrwen/twitter2pg
cd twitter2pg
npm install
```

### Tests

1. Clone into current path `git clone https://github.com/rrwen/twitter2pg`
2. Enter into folder `cd twitter2pg`
3. Ensure [devDependencies](https://docs.npmjs.com/files/package.json#devdependencies) are installed and available
4. Run tests with a `.env` file (see [tests/README.md](tests/README.md))
5. Results are saved to [tests/log](tests/log) with each file corresponding to a version tested

```
npm install
npm test
npm test_rest
npm test_stream
```

### Documentation

Use [documentationjs](https://www.npmjs.com/package/documentation) to generate html documentation in the `docs` folder:

```
npm run docs
```

See [JSDoc style](http://usejsdoc.org/) for formatting syntax.

### Upload to Github

1. Ensure [git](https://git-scm.com/) is installed
2. Inside the `twitter2pg` folder, add all files and commit changes
3. Push to github

```
git add .
git commit -a -m "Generic update"
git push
```

### Upload to npm

1. Update the version in `package.json`
2. Run tests and check for OK status (see [tests/README.md](tests/README.md))
3. Generate documentation
4. Login to npm
5. Publish to npm

```
npm test
npm test_rest
npm test_stream
npm run docs
npm login
npm publish
```

### Implementation

The module [twitter2pg](https://www.npmjs.com/package/twitter2pg) uses the following [npm](https://www.npmjs.com/) packages for its implementation:

npm | Purpose
--- | ---
[twitter2return](https://www.npmjs.com/package/twitter2return) | Connections to the Twitter API REST and Streaming Application Programming Interfaces (APIs) using [twitter](https://www.npmjs.com/package/twitter) with a query language called [jsonata](https://www.npmjs.com/package/jsonata) to filter TWitter JSON data before inserting into PostgreSQL
[pg](https://www.npmjs.com/package/pg) | Insert Twitter data Connect to PostgreSQL tables

```
twitter2return   <-- Extract Twitter data from API and Filter JSON data
    |
   pg            <-- Insert filtered Twitter data into PostgreSQL table
```
