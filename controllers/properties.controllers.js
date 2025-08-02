
const { fetchAllProperties } = require('../models/properties.models');
const { checkExists } = require('../utils');

// Get all properties with optional filters like price, type, sorting,ordering
exports.getAllProperties = async (req, res, next) => {
  const { minprice, maxprice, property_type, sort, order } = req.query;

// Check if minprice and maxprice are numbers, else return error 400
  if ((minprice && isNaN(minprice)) || (maxprice && isNaN(maxprice))) {
    return res.status(400).send({ msg: "Please use numbers for minprice and maxprice" });
  }

// If property_type is there, make sure it is in the database
  try {
    if (property_type) {
      await checkExists("properties", "property_type", property_type);
    }
 // Fetch properties from database with given filters
    const properties = await fetchAllProperties(minprice, maxprice, property_type, sort, order);

    

    //If no properties found, send 404 error
    if (properties.length === 0) {
      throw { status: 404, msg: "No properties found with the provided criteria." };
    }
 // Send back the found properties with status 200
    return res.status(200).send({ properties });

  } catch (err) {
    console.log('Error caught:', err);
  // Send 404 error if no properties found
    if (err.status === 404) {
      return res.status(404).send({ msg: err.msg || "No properties found." });
    }
   // Pass other errors to the next error handler
    next(err);
  }
};

// Get properties that match the property_type from the URL
exports.getPropertyByType = async (req, res, next) => {
const { property_type } = req.params;

// Check if the property_type exists
try {
  await checkExists("properties", "property_type", property_type);
// Fetch properties of that type
  const properties = await fetchAllProperties(null, null, property_type);
  res.status(200).send({ properties });
} catch (err) {
// If property_type not found, send 404 error
  if (err.status === 404) {
    return res.status(404).send({ msg: err.msg });
  }

//Show other errors and send a server error message (500)
  console.error(err);
  res.status(500).send("Server error");
}


};
