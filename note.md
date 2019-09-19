'use strict';

const express = require('express');
require('dotenv').config();
const pg = require('pg');

const app = express();

const PORT = process.env.PORT || 3000;

//connect to the database
//DATABASE_URL=postgress://<username>:<password>@localhost:5432/name-of-database
//Put the above line into .env file
const client = new pg.Client(process.env.DATTABASE_URL);
client.on('error', err => console.error(err));

// routes
app.get('/', (request, response) => {
  response.status(200).send('I am alive');
})

app.get('/add', (request, response) => {
  let firstName = request.query.first;
  let lastName = request.query.last;

  // save info in database. The dollar sign is for safe values.
  // A sql statement always ends with a ; and in this case this is a string
  let sql = 'INSERT INTO people (first_name, last_name) VALUES ($1, $2);';
  let value = [firstName, lastName];
  //below line is making a database query in a format of sql and value. That will put together sql and value together, and replace place holders $1 and $2 with value array and save it to database.
  // side note: you can't put ; in between promise function and .then because it will tell that it is ended.
  client.query(sql, value)
    .then(pgResults => {
      response.status(200).json(pgResults);
    })
    .catch(error => errorHandler(error));
})

app.use('*', (request, response) => {
  response.status(404).send('The page does not exist');
})

app.use(errorHandler);

function errorHandler(error, request, response) {
  response.status(500).send(error);
}

client.connect()
  .then(() => {}
    app.listen(PORT,  () => console.log(`listening on ${PORT}`))
  )}
  .catch(error => errorHandler(error));

