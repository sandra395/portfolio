const format = require('pg-format');
const db = require('./db/connection');

//checks that a property-type exists
const checkExists = async (table, column, value, resource) => {
  // Ask the database to find rows where the column matches the value
  const queryStr = format (`SELECT * FROM %I WHERE %I = $1;`,table,column);
  const dbOutput = await db.query(queryStr, [value]);


// If nothing is found, give a "not found" error
  if (dbOutput.rows.length === 0) {
    return Promise.reject({ status: 404, msg: `${resource} not found` });
  }

  // If found, return true
  return true;
};

//Check if the user has favourited the property

const checkIfPropertyIsFavourited = async (propertyId, userId) => {
  // Run a query to find if there's a favourite for this property by this user
  const result = await db.query(
    `SELECT * FROM favourites WHERE property_id = $1 AND guest_id = $2`,
    [propertyId, userId]
  );

   // Give back true if it’s there, false if not
  return result.rows.length > 0;
};

module.exports = {
  checkExists,
  checkIfPropertyIsFavourited
};
