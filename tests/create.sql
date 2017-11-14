CREATE USER twitter2pg_user WITH LOGIN PASSWORD 'twitter2pg_password';
CREATE DATABASE twitter2pg_database;
\c twitter2pg_database
CREATE TABLE IF NOT EXISTS twitter2pg_table(tweets jsonb);
ALTER TABLE twitter2pg_table OWNER TO twitter2pg_user;