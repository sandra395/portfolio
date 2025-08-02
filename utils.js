const format = require('pg-format');
const db = require('./db/connection');

// Checks if a value exists
const checkExists = async (table, column, value) => {
// Make a database query to find records where the column has the value, ignoring uppercase or lowercase
    const queryStr = format(`SELECT * FROM %I WHERE LOWER(%I) = LOWER($1);`, table, column);
 // Run the query with the given value
    const result = await db.query(queryStr, [value]);
  
 // If no rows found, return a 404 error with a message
// If found, return true
    if (result.rows.length === 0) {
      return Promise.reject({ status: 404, msg: `${column} not found` });
    }
    return true;
};

module.exports = { checkExists };