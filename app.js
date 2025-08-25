// Bring in the Express library so we can make a web server
const express = require("express");
// Use path to find files on the computer
const path = require("path");
// Load settings from the .env file
require("dotenv").config();
// Serve all static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Use property-related functions
const { getAllProperties, getPropertyByType, postPropertyReview, getPropertyById,getPropertyReviews, deleteReview } 
  = require("./controllers/properties.controllers");
  // Get the functions that handle errors
const { notFoundHandler, errorHandler } = require("./controllers/errors.handlers");
// Import the getUserById controller function from the users controller file
const { getUserById } = require("./controllers/users.controller");
// Start an Express app to run the server
const app = express();
// Making sure we can use data sent as JSON
app.use(express.json());


// endpoints

// GET /api/properties
// Sends back all properties (you can filter or sort them)
app.get("/api/properties", getAllProperties);

// GET /api/properties/type/:property_type
// Returns properties of a specific type
app.get("/api/properties/type/:property_type", getPropertyByType);

// GET /api/users/:id
// Returns a single user by ID
app.get("/api/users/:id", getUserById);

// GET /api/properties/:id/reviews
// Returns all reviews for a specific property
app.get("/api/properties/:id/reviews", getPropertyReviews);

// GET /api/properties/:id
// Returns a single property by ID
app.get("/api/properties/:id", getPropertyById);

// POST /api/properties/:id/reviews
// Creates a new review for a specific property
app.post("/api/properties/:id/reviews", postPropertyReview);

// DELETE /api/reviews/:id
// Deletes a review by its ID
app.delete("/api/reviews/:id", deleteReview);

// Shows the homepage file when you go to the main web address
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// Sends a “page not found” message if the URL is wrong(shows 404 error)
app.use(notFoundHandler);

// Deals with errors that happen anywhere in the app
app.use(errorHandler);

// Make the app available to other files like server.js or tests
module.exports = app;
