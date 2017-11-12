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

**Install.** The tests for [twitter2pg]() require a local development PostgreSQL database to be setup:

1. Install [PostgreSQL](https://www.npmjs.com/package/twitter2pg)
2. Add the `psql` command to the system environment (See [Windows Environment](#windows-environment) if the command below does not run)

```
psql --help
```

**Step 1.** Enter the `psql` command line interface:

* `-h`: database host address
* `-p`: database port number
* `-d`: maintenance database name (must already exist)
* `-U`: user name of administrative user

```
psql -h localhost -p 5432 -d postgres -U admin
```

**Step 2.** Create a test super user, database, and table (exiting `psql` after): 

* **user**: twitter2pg_user
* **password**: twitter2pg_password
* **database**: twitter2pg_database
* **table**: twitter2pg_table
* **column**: tweets
* **column_type**: jsonb

```sql
CREATE ROLE 'twitter2pg_user' WITH LOGIN PASSWORD 'twitter2pg_password' SUPERUSER;
CREATE DATABASE 'twitter2pg_database';
CREATE TABLE IF NOT EXISTS 'twitter2pg_table' (tweets jsonb);
\q
```

**Step 3.** Run [Tests](../README.md#tests) using `npm` (outside of `psql`):

```sh
npm test
```

**Optional.** Drop the test database and user using `psql` with your admin user:

```sh
psql -h localhost -p 5432 -d postgres -U admin -c "DROP DATABASE IF EXISTS twitter2pg_database; DROP USER IF EXISTS twitter2pg_user;"
```

### Windows Environment

The PostgreSQL commands may not be added to the system environmental variables. You may temporarily add these commands by including the PostgreSQL bin folder in the system environment (replacing `9.6` with your version of PostgreSQL):

```
SET PATH=%PATH%;C:\Program Files\PostgreSQL\9.6\bin
psql --help
```
