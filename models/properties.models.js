const db = require("../db/connection");

// Get properties from the database with filters and sorting if given
const fetchAllProperties = async (minprice, maxprice, property_type, sort, order) => {
  const queryValues = [];

// start SQL query to get properties with host name and how popular they are
  let queryString = `
    SELECT 
      p.property_id, 
      p.name AS property_name, 
      p.location, 
      p.price_per_night AS cost_per_night,  
      p.price_per_night AS price_per_night, 
      p.property_type,
      u.first_name || ' ' || u.surname AS host,
      COUNT(f.favourite_id) AS popularity 
    FROM properties p
    JOIN users u ON p.host_id = u.user_id
    LEFT JOIN favourites f ON p.property_id = f.property_id
  `;

   // If minprice filter exists, add it to the query
  if (minprice) {
    queryValues.push(minprice);
    queryString += ` WHERE p.price_per_night >= $${queryValues.length}`;
  }

  // If maxprice is given, add it to the query with the right WHERE or AND word
  if (maxprice) {
    queryValues.push(maxprice);
    if (queryValues.length === 1) {
      queryString += ` WHERE p.price_per_night <= $${queryValues.length}`;
    } else {
      queryString += ` AND p.price_per_night <= $${queryValues.length}`;
    }
  }

// If property_type is given, first check if it is in the property_types table
  if (property_type) {
    // Check property_type existence first
    const typeCheckResult = await db.query(
      `SELECT * FROM property_types WHERE LOWER(property_type) = LOWER($1)`,
      [property_type]
    );

// Throw error if property_type is not found
    if (typeCheckResult.rows.length === 0) {
      throw { status: 404, msg: "property_type not found" };
    }

// Add property_type value to the list of query values
    queryValues.push(property_type);
    // If this is the first filter, add WHERE clause for property_type
    // Otherwise, add AND clause to combine with existing filters
    if (queryValues.length === 1) {  
      queryString += ` WHERE p.property_type = $${queryValues.length}`;
    } else {
      queryString += ` AND p.property_type = $${queryValues.length}`;
    }
  }

   // Group results by property to get correct popularity counts
  queryString += `
    GROUP BY p.property_id, p.name, p.location, p.price_per_night, u.first_name, u.surname, p.property_type
  `;

  // List the good choices for sorting and ordering
  const sorting = {
    cost_per_night: 'cost_per_night',
    price_per_night: 'price_per_night',
    popularity: 'popularity'
  };

  const ordering = {
    ascending: 'ASC',
    descending: 'DESC'
  };

  // If sort and order are okay, add sorting; if not, sort by popularity from high to low
  if (sorting[sort] && ordering[order]) {
    queryString += ` ORDER BY ${sorting[sort]} ${ordering[order]}`;
  } else {
    queryString += ` ORDER BY popularity DESC`;
  }

  // Run the database query and change some fields to numbers before giving back the results
  return db.query(queryString, queryValues)
    .then(({ rows }) => {
      return rows.map(row => ({
        ...row,
        cost_per_night: Number(row.cost_per_night),
        price_per_night: Number(row.price_per_night),
        popularity: Number(row.popularity),
      }));
    });
};

module.exports = { fetchAllProperties };
