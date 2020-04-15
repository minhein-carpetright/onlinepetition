DROP TABLE IF EXISTS users, signatures;


CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      first VARCHAR(255) NOT NULL,
      last VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 );


CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL CHECK (signature != ''),
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- here we are adding the foreign key (user_id)
-- foreign key lets us identify which user from the users table signed the petition
-- and which signature is theirs (acts as an identifier between the 2 tables!)
