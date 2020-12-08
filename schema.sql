CREATE TABLE credentials (
	id INTEGER PRIMARY KEY,
	uri TEXT NOT NULL UNIQUE,
	username TEXT NOT NULL,
	password TEXT NOT NULL,
	db TEXT NOT NULL
);

INSERT INTO credentials values(1, "neo4j+s://demo.neo4jlabs.com", "movies", "movies", "movies");

