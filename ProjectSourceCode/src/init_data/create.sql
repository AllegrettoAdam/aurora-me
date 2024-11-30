CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    img TEXT,
    username VARCHAR(16) NOT NULL,
    email VARCHAR(40) NOT NUll,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    img TEXT,
    text VARCHAR(500),
    user_id BIGINT NOT NULL
);

ALTER TABLE posts
ADD CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES users (id);