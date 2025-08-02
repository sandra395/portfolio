const express = require('express');
const request = require("supertest");
const db = require("./db/connection");
const { getAllProperties, getPropertyByType } = require('./controllers/properties.controllers');
const { fetchAllProperties } = require('./models/properties.models');

require('dotenv').config();

const app = express();

// Get properties, with or without filters
app.get("/api/properties", getAllProperties)

//non-existent path to always return 404 with a message
app.get("/non-existent-path", (req, res, next) => {
  res.status(404).send({ msg: "Path not found" });
});

//get properties by their type
app.get("/api/properties/type/:property_type", getPropertyByType);












module.exports = app;