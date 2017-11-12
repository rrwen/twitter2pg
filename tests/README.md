# twitter2pg

Richard Wen  
rrwen.dev@gmail.com  

Module for extracting Twitter data to PostgreSQL databases

[![npm version](https://badge.fury.io/js/twitter2pg.svg)](https://badge.fury.io/js/twitter2pg)
[![Build Status](https://travis-ci.org/rrwen/rrwen/twitter2pg.svg?branch=master)](https://travis-ci.org/rrwen/twitter2pg)
[![Coverage Status](https://coveralls.io/repos/github/rrwen/twitter2pg/badge.svg?branch=master)](https://coveralls.io/github/rrwen/twitter2pg?branch=master)
[![npm](https://img.shields.io/npm/dt/twitter2pg.svg)](https://www.npmjs.com/package/twitter2pg)
[![GitHub license](https://img.shields.io/github/license/rrwen/twitter2pg.svg)](https://github.com/rrwen/twitter2pg/blob/master/LICENSE)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/rrwen/twitter2pg.svg?style=social)](https://twitter.com/intent/tweet?text=Module%20for%20extracting%20Twitter%20data%20to%20PostgreSQL%20databases:%20https%3A%2F%2Fgithub.com%2Frrwen%2Ftwitter2pg%20%23nodejs%20%23npm)

## Test Environment

The test environment requires an isolated PostgreSQL database named `twitter2pg_database` and a super user named `twitter2pg_user` with the following definitions:

Setting | Value
--- | ---
**user** | twitter2pg_user
**password** | twitter2pg_password
**database** | twitter2pg_database
**table** | twitter2pg_table
**column** | tweets
**type** | jsonb

**Setup.** The tests for [twitter2pg](https://www.npmjs.com/package/twitter2pg) require a local development PostgreSQL database to be setup:

1. Ensure [PostgreSQL](https://www.postgresql.org/) is installed
2. Add the `psql` command to the system environment

```
psql --help
```

**Step 1.** Create the test super user, database, and table by passing the [create.sql](create.sql) file to `psql`:

* `-h`: database host address
* `-p`: database port number
* `-d`: maintenance database name (must already exist)
* `-U`: user name of administrative user

```
psql -h localhost -p 5432 -d postgres -U admin -f tests/create.sql
```

**Step 2.** Run [Tests](../README.md#tests) using `npm` (outside of `psql`):

```sh
npm test
```

**Optional.** Drop the test database and user by passing the [drop.sql](drop.sql) file to `psql`:

```sh
psql -h localhost -p 5432 -d postgres -U admin -f tests/drop.sql
```
