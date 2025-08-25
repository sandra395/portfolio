// Load the data for development and test environments
const devData= require('./dev');
const testData = require("./test");
// Check which environment we are in: "development" or "test"
// If not set, use "development"
const ENV = process.env.NODE_ENV || "development";
// Choose the right data based on the environment
const data= {development:devData, production:devData, test:testData};

// Export the correct data
// If the environment is not recognized, use development data
module.exports = data[ENV];