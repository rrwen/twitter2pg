# twitter2pg

Richard Wen  
rrwen.dev@gmail.com  

Module for extracting Twitter data to PostgreSQL databases

[![npm version](https://badge.fury.io/js/twitter2pg.svg)](https://badge.fury.io/js/twitter2pg)
[![Build Status](https://travis-ci.org/rrwen/twitter2pg.svg?branch=master)](https://travis-ci.org/rrwen/twitter2pg)
[![Coverage Status](https://coveralls.io/repos/github/rrwen/twitter2pg/badge.svg?branch=master)](https://coveralls.io/github/rrwen/twitter2pg?branch=master)
[![npm](https://img.shields.io/npm/dt/twitter2pg.svg)](https://www.npmjs.com/package/twitter2pg)
[![GitHub license](https://img.shields.io/github/license/rrwen/twitter2pg.svg)](https://github.com/rrwen/twitter2pg/blob/master/LICENSE)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/rrwen/twitter2pg.svg?style=social)](https://twitter.com/intent/tweet?text=Module%20for%20extracting%20Twitter%20data%20to%20PostgreSQL%20databases:%20https%3A%2F%2Fgithub.com%2Frrwen%2Ftwitter2pg%20%23nodejs%20%23npm)

## Test Environment

The test environment creates an isolated PostgreSQL database named `twitter2pg_database` to run tests on.

To connect to Twiter and PostgreSQL, a `.env` file is required:

1. Create a `.env` file in the root directory
2. Use the template below to provide Twitter credentials and PostgreSQL connection details inside the `.env` file

```
TWITTER_CONSUMER_KEY=***
TWITTER_CONSUMER_SECRET=***
TWITTER_ACCESS_TOKEN_KEY=***
TWITTER_ACCESS_TOKEN_SECRET=***
PGHOST=localhost
PGPORT=5432
PGUSER=super_user
PGPASSWORD=***
```

The [Tests](../README.md#tests) can then be run with the following command:

```
npm test
```

## Manual Tests

Additional manual tests are based on the [Usage](../README.md#usage) documentation and are saved in (log)[#log].  
  
In addition to the [Test Environment](#test-environment) `.env` file setup, you will have to run [create.sql](#create.sql) in [psql](https://www.postgresql.org/docs/current/static/app-psql.html) to create empty test tables named `twitter_rest` and `twitter_stream`:

* `-h`: host address
* `-p`: port number
* `-d`: database name
* `-U`: user name with table creation permissions
* `-c`: PostgreSQL query

```
psql -h localhost -p 5432 -d postgres -U postgres -f tests/create.sql
```

Once [create.sql](create.sql) is finished creating the test tables, you may run the following to test the [REST API](../README.md#rest-api) and [Streaming API](../README.md#stream-api) usage examples respectively:

```
npm run test_rest
npm run test_stream
```

After manual testing, you may wish to drop the test tables named `twitter_rest` and `twitter_stream` with [drop.sql](drop.sql):

```
psql -h localhost -p 5432 -d postgres -U postgres -f tests/drop.sql
```
