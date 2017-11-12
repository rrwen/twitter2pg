CREATE USER twitter2pg_user WITH LOGIN PASSWORD 'twitter2pg_password' SUPERUSER;
CREATE DATABASE twitter2pg_database;
CREATE TABLE IF NOT EXISTS twitter2pg_table(tweets jsonb);