'use strict';
//server
const express = require('express');
const cors = require('cors');
const superAgent = require('superagent');

require('dotenv').config();

const app = express();

app.use(cors());
const PORT= process.env.PORT || 3000

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

      const location = new Location(searchQuery, formatted_address, lat, long)

      response.status(200).send(location);
    })
    .catch(error => {
      console.log('Something went wrong');
    })
})

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
      console.log('Something went wrong');
    })
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
      console.log('Something went wrong');
    })
});

app.use('*', (request, response) => {
  response.status(500).send('Sorry, something went wrong');
});

app.listen(PORT, () => {console.log(`listening on port ${PORT}`)});
