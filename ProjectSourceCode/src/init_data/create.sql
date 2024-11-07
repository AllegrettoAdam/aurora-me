CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    img VARCHAR(1000),
    username VARCHAR(16) NOT NULL,
    email VARCHAR(40) NOT NUll,
    password VARCHAR(32) NOT NULL
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    img VARCHAR(1000),
    text VARCHAR(500),
    user_id BIGINT
);

ALTER TABLE posts
ADD CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES users (id);