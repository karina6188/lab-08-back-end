'use strict';
//server
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superAgent = require('superagent');

require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000

const client = new pg.Client(process.env.DATABASE_URL);

// constructor funcitons -------------------------------------------------------------------------------
function Location(searchQuery, formatted_address, lat, long) {
  this.search_query = searchQuery;
  this.formatted_address = formatted_address;
  this.latitude = lat;
  this.longitude = long;
}

function Forecast(summary, time) {
  this.forecast = summary;
  this.time = new Date(time *1000).toDateString();
}

function Event(eventBriteStuff) {
  this.link = eventBriteStuff.url;
  this.name = eventBriteStuff.name.text;
  this.event_date = new Date(eventBriteStuff.local).toDateString();
  this.summary = eventBriteStuff.summary;
}

// get data from APIs--- -------------------------------------------------------------------------------
app.get('/location', (request, response) => {
  let searchQuery = request.query.data;
  let geocodeurl = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`;

  superAgent.get(geocodeurl)
    .then(responsefromAgent => {
      const formatted_address = responsefromAgent.body.results[0].formatted_address;
      const lat = responsefromAgent.body.results[0].geometry.location.lat;
      const long = responsefromAgent.body.results[0].geometry.location.lng;

      const newLocation = new Location(searchQuery, formatted_address, lat, long)

      let sql = `INSERT INTO location (search_query, formatted_address, latitude, longitude) VALUES ($1, $2, $3, $4);`;
      let value = [newLocation.search_query, newLocation.formatted_address, newLocation.lat, newLocation.long];
      client.query(sql, value)
      response.send(newLocation);
    })
    .catch(error => {
      errorHandler(error, request, response);
    });
});

app.get('/weather', (request, response) => {
  let locationDataObj = request.query.data;
  let latitude = locationDataObj.latitude;
  let longitude = locationDataObj.longitude;
  let URL = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${latitude},${longitude}`;

  superAgent.get(URL)
    .then(dataFromWeather => {
      let weatherDataResults = dataFromWeather.body.daily.data;
      const dailyArray = weatherDataResults.map(day => new Forecast(day.summary, day.time));

      response.send(dailyArray);
    })
    .catch(error => {
      errorHandler(error, request, response);
    });
});

app.get('/events', (request, response) => {
  let locationObj = request.query.data;
  const eventUrl = `http://www.eventbriteapi.com/v3/events/search?token=${process.env.EVENTBRITE_API_KEY}&location.address=${locationObj.formatted_address}`;

  superAgent.get(eventUrl)
    .then(eventBriteData => {
      const eventBriteInfo = eventBriteData.body.events.map(eventData => new Event(eventData));

      response.send(eventBriteInfo);
    })
    .catch(error => {
      errorHandler(error, request, response);
    });
});

function errorHandler(error, request, response){
  console.error(error);
  response.status(500).send('Something went wrong');
}

app.listen(PORT, () => {console.log(`listening on port ${PORT}`)});
