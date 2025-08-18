// Load the app setup from app.js
const app = require("./app");

// Start the server
app.listen(9090, () => {
  console.log("listening...");
});