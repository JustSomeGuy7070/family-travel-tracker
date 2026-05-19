CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  country_code CHAR(2) UNIQUE NOT NULL,
  country_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(15) UNIQUE NOT NULL,
  color VARCHAR(15) NOT NULL
);

CREATE TABLE IF NOT EXISTS visited_countries (
  id SERIAL PRIMARY KEY,
  country_code CHAR(2) NOT NULL REFERENCES countries(country_code),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (country_code, user_id)
);

INSERT INTO users (name, color)
VALUES ('Gee', 'teal'), ('Zee', 'powderblue')
ON CONFLICT (name) DO NOTHING;
