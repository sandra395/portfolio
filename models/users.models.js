const db = require("../db/connection");

 // Get a user by their ID from the database
async function fetchUserById(userId) {
  // Run the SQL query to find the user with the given ID
  const result = await db.query("SELECT * FROM users WHERE user_id = $1", [userId]);
  // If no user found, return null
  if (result.rows.length === 0) return null; 
  // If user found, return the first user row
  return result.rows[0];
}

// Export the function so other files can use it
module.exports = { fetchUserById };