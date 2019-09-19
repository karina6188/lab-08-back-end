DROP TABLE IF EXISTS location;

CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_address VARCHAR(255),
    latitude VARCHAR(255),
    longitude VARCHAR(255)
);