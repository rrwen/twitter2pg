DROP TABLE IF EXISTS twitter_rest;
DROP TABLE IF EXISTS twitter_stream;
CREATE TABLE IF NOT EXISTS twitter_rest(tweets jsonb);
CREATE TABLE IF NOT EXISTS twitter_stream(tweets jsonb);