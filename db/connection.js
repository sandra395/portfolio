// Get the Pool tool from the pg package (lets us talk to PostgreSQL)
const { Pool } = require("pg");

// Load settings from the .env file (like database name, password, etc.)
require("dotenv").config();

// Create a set of connections to the database
// This makes talking to the database faster and easier
const pool = new Pool();

// Share this pool with other files in our app
module.exports = pool;
