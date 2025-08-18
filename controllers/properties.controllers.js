const { fetchAllProperties, fetchPropertyById,deleteReview,fetchPropertyReviews, fetchAverageRating } = require("../models/properties.models");
const {fetchUserById} = require("../models/users.models")
const { checkExists,checkIfPropertyIsFavourited } = require("../utils");
const db = require("../db/connection");

// Get all properties with optional filters like price, type, sorting,ordering
exports.getAllProperties = async (req, res, next) => {
  const { minprice, maxprice, property_type, sort, order } = req.query;

  // Sort and order options for database queries
  const sortingOptions = {
    cost_per_night: "p.price_per_night",
    popularity: "popularity"
  };
  
  const orderingOptions = {
    asc: "ASC",
    desc: "DESC"
  };

  // Check if the user gave valid sort and order values
// If not, return 400 error
  const validSorts = Object.keys(sortingOptions);
  const validOrders = Object.keys(orderingOptions);
  
  if (sort && !validSorts.includes(sort)) {
    return res.status(400).json({ msg: "Invalid sort field" });
  }
  
  if (order && !validOrders.includes(order)) {
    return res.status(400).json({ msg: "Invalid order value" });
  }
  
  // Decide which database column and order to use for sorting
// Use defaults if none given
  const sortColumn = sort ? sortingOptions[sort] : "popularity";
  const sortOrder = order ? orderingOptions[order] : "DESC";

  
  // Make sure minprice/maxprice are numbers if given
  if ((minprice && isNaN(minprice)) || (maxprice && isNaN(maxprice))) {
    return res.status(400).send({ msg: "Please use numbers for minprice and maxprice" });
  }

  try {
    // Check property_type exists in database
    if (property_type) {
      const result = await db.query(
        `SELECT * FROM property_types WHERE property_type = $1`,
        [property_type]
      );
      if (result.rows.length === 0) {
        return res.status(404).send({ msg: "property_type not found" });
      }
    }

    // Fetch properties from the database
    const properties = await fetchAllProperties(minprice, maxprice, property_type, sortColumn, sortOrder);

    res.status(200).json({ properties });
  } catch (err) {
    console.error("Error in getAllProperties:", err);
    next(err);
  }
};



//GET /api/properties/type/:property_type
//Shows properties of a certain type
exports.getPropertyByType = async (req, res, next) => {
  const { property_type } = req.params;

  try {
    const properties = await fetchAllProperties(null, null, property_type);
    res.status(200).send({ properties });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).send({ msg: err.msg || "property_type not found" });
    }
    console.error(err);
    res.status(500).send("Server error");
  }
};


// GET /api/properties/:id
//Shows details for a property by ID (and marks it as 'favourited' if user_id is given)
exports.getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    const property = await fetchPropertyById(id);

    //if property doesn't exist,return 404
    if (!property) {
      return res.status(404).json({ msg: "Property not found" });
    }

   // If we have a user_id, check if this user has favourited the property
    if (user_id) {
      property.favourited = await checkIfPropertyIsFavourited(property.property_id, user_id);
    }

    res.status(200).json({ property });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ msg: error.msg || "Property not found" });
    }
    console.error("Error in getPropertyById:", error);
    next(error);
  }
};

// POST /api/properties/:id/reviews
// Adds a review for a property
exports.postPropertyReview = async (req, res, next) => {

  try {
    const propertyId = req.params.id;
    const { guest_id, rating, comment } = req.body;

    // Check if rating is given
    if (!rating) {
      return res.status(400).send({ msg: "rating is required" });
    }

   // Validate rating is a number between 1 and 5
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).send({ msg: "rating must be a number between 1 and 5" });
    }


   // Making sure the property exists
    const propertyExists = await fetchPropertyById(propertyId);
    if (!propertyExists) {
      return res.status(404).send({ msg: "Property not found" });
    }

    // Making sure the user exists

    console.log("Checking guest_id in DB:", guest_id);
    const user = await fetchUserById(guest_id);
    console.log("User fetched:", user);
    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }
   
    // Add the review to the database
    const result = await db.query(
      `INSERT INTO reviews (property_id, guest_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [propertyId, guest_id, rating, comment]
    );

    res.status(201).send(result.rows[0]);
  } catch (err) {
    console.error("Error in postPropertyReview:", err);
    next(err);
  }
};
    
// GET /api/properties/:id/reviews
exports.getPropertyReviews = async (req, res, next) => {
  const propertyId = Number(req.params.id);

  if (isNaN(propertyId)) {
    return res.status(400).json({ msg: "Invalid property ID" });
  }

  try {
    const reviews = await fetchPropertyReviews(propertyId);
    let average_rating = await fetchAverageRating(propertyId);

    
// Convert to number and default to 0 if null
average_rating = parseFloat(average_rating) || 0;

    res.status(200).json({ reviews, average_rating });
  } catch (err) {
    console.error("Error in getPropertyReviews:", err);
    next(err);
  }
};


      //const reviews = await fetchPropertyReviews(propertyId);

      // Calculate average rating
        //const average_rating = reviews.length
          //? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
         // : 0;
    
        //res.status(200).json({ reviews});
      //} catch (err) {
       // next(err);
      //}
    //};

    //DELETE /api/reviews/:id
    //Delete a review by its ID
    exports.deleteReview = async (req, res, next) => {
      try {
        const reviewId = req.params.id;
    
      // Check reviewId is a number
        if (isNaN(Number(reviewId))) {
          return res.status(400).json({ msg: "Invalid review ID" });
        }
    
        const result = await deleteReview(reviewId);
    
        // If no review was deleted, send 404
      if (!result) {
  return res.status(404).json({ msg: "no body" });
}
    
      // Deleted successfully, nothing to send back
        return res.status(204).send();
      } catch (err) {
        next(err);
      }
    };