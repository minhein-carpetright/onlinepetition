DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    first VARCHAR(70) NOT NULL CHECK (first != ''),
    last VARCHAR(70) NOT NULL CHECK (last != ''),
    signature TEXT NOT NULL CHECK (signature != ''),
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);