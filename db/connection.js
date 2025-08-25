// Get the Pool tool from the pg package
const { Pool } = require("pg");
const path = require("path");

// Determine the current environment: "development", "test", or "production"
const ENV = process.env.NODE_ENV || "development";
console.log("Current ENV:", ENV);

// Load the right .env file based on environment
require("dotenv").config({ path: path.resolve(__dirname, `../.env.${ENV}`) });

// Make an empty object to store database settings
const config = {};

// Check if we are in production (live app)
if (ENV === "production") {
  // Give the app the database link from the environment
  config.connectionString = process.env.DATABASE_URL;
  // Optional: allow only 2 connections at the same time
  config.max = 2;
}

// Create a set of connections to the database
const pool = new Pool(config);

// Share this pool with other files in the app
module.exports = pool;
