// Load the app setup from app.js
const app = require("./app");

// Destructure PORT from environment variables, defaulting to 9090 if not set
const{PORT = 9090} = process.env;

// Start the server
app.listen(PORT,()=> {
  console.log("listening...");
});