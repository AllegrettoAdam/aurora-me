CREATE TABLE users (
    id INT PRIMARY KEY,
    img VARCHAR(1000),
    username VARCHAR(32) NOT NULL,
    password VARCHAR(32) NOT NULL,
)

CREATE TABLE posts (
    id BIGINT PRIMARY KEY,
    img VARCHAR(1000),
    text VARCHAR,
    user_id INT,
)