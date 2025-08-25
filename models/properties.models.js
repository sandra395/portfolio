const { getUserById } = require("../models/users.models");
const db = require("../db/connection");

// Get properties from the database with filters and sorting if given
const fetchAllProperties = async (minprice, maxprice, property_type, sortColumn = "popularity", sortOrder = "DESC") => {
  const queryValues = []; // store values to use in the query
  const filters = []; // Keep a list of filters to find certain properties

    // Convert query params to numbers if they exist
    minprice = minprice ? Number(minprice) : undefined;
    maxprice = maxprice ? Number(maxprice) : undefined;

// start SQL query to get properties with host name and how popular they are
let queryString = `
SELECT 
  p.property_id, 
  p.name AS property_name, 
  p.location, 
  p.price_per_night::INT AS price_per_night, 
  p.property_type,
  u.first_name || ' ' || u.surname AS host,
  COUNT(f.favourite_id)::INT AS popularity 
FROM properties p
JOIN users u ON p.host_id = u.user_id
LEFT JOIN favourites f ON p.property_id = f.property_id
`;

  // If minprice is given, add it as a filter
  if (minprice !== undefined) {
    queryValues.push(minprice);
    filters.push(`p.price_per_night >= $${queryValues.length}`);
  }

 // If maxprice is given, add it as a filter
 if (maxprice !== undefined) {
  queryValues.push(maxprice);
  filters.push(`p.price_per_night <= $${queryValues.length}`);
 }

 
  // If we have any filters, add them to the query
  if (property_type) {
    queryValues.push(property_type);
    filters.push(`p.property_type = $${queryValues.length}`);
  }
  
// Add all filters in one WHERE clause
if (filters.length > 0) {
  queryString += ` WHERE ${filters.join(" AND ")}`;
}

   // Group results by property to get correct popularity counts
  queryString += `
    GROUP BY p.property_id, p.name, p.location, p.price_per_night, u.first_name, u.surname, p.property_type
    ORDER BY  ${sortColumn} ${sortOrder}
  `;


  // Run the query and get results
  const result = await db.query(queryString, queryValues);

//return de list of properties
  return result.rows; 
};

// Get full details of a property using its ID
  const fetchPropertyById = async (propertyId) => {
    const queryStr = `
      SELECT 
        p.property_id,
        p.name AS property_name,
        p.location,
        p.price_per_night::INT AS price_per_night,
        p.description,
        p.property_type,
        u.first_name || ' ' || u.surname AS host,
        u.avatar AS host_avatar,
        COUNT(f.favourite_id)::INT AS favourite_count
      FROM properties p
      JOIN users u ON p.host_id = u.user_id
      LEFT JOIN favourites f ON p.property_id = f.property_id
      WHERE p.property_id = $1
      GROUP BY p.property_id, u.first_name, u.surname, u.avatar, p.name, p.location, p.price_per_night, p.description, p.property_type
    `;
      // Run the query to find the property
    const result = await db.query(queryStr, [propertyId]);
  
      // If no property found, send 404 error
    if (result.rows.length === 0) {
      throw { status: 404, msg: "Property not found" };
    }
    
    // Return the property info
    return result.rows[0];
};
  
const checkIfPropertyIsFavourited = async (propertyId, userId) => {
  const result = await db.query(
    `SELECT 1 FROM favourites WHERE property_id = $1 AND user_id = $2`,
    [propertyId, userId]
  );
  return result.rows.length > 0;
};
   
  //Add a review to a property
const addReviewToProperty = async (property_id, guest_id, rating, comment) => {
    const result = await db.query(
      `INSERT INTO reviews (property_id, guest_id, rating, comment)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [property_id, guest_id, rating, comment]
    );
    return result.rows[0];
  };

  // Get all reviews for a property
  const fetchPropertyReviews = async (propertyId) => {
    const result = await db.query(
      `SELECT 
         r.review_id, 
         r.rating, 
         r.comment, 
         r.created_at, 
         u.first_name || ' ' || u.surname AS guest,
         u.avatar AS guest_avatar
       FROM reviews r
       JOIN users u ON r.guest_id = u.user_id
       WHERE r.property_id = $1
       ORDER BY r.created_at DESC`,
      [propertyId]
    );
    return result.rows || [];
  };

  
  
  // Delete a review by its ID
  const deleteReview = async (reviewId) => {
    const result = await db.query(
      `DELETE FROM reviews WHERE review_id = $1 RETURNING *`,
      [reviewId]
    );
    return result.rows[0];  // info about deleted review
  };
  

  // Get average rating for a property
const fetchAverageRating = async (propertyId) => {
  const result = await db.query(
    `SELECT AVG(rating)::numeric(10,2) AS average_rating
     FROM reviews
     WHERE property_id = $1`,
    [propertyId]
  );

  // If no reviews, average_rating will be null → default to 0
  return result.rows[0].average_rating || 0;
};

  module.exports = {
    fetchAllProperties,
    fetchPropertyById,
    addReviewToProperty,
    fetchPropertyReviews,
    getUserById,
    deleteReview,
    fetchAverageRating,
    checkIfPropertyIsFavourited
  };
  