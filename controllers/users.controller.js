const { fetchUserById } = require("../models/users.models");

// Find user by ID and send back info
exports.getUserById = async (req, res, next) => {
  const userId = req.params.id;


  try {
    // Get user data from the database
    const user = await fetchUserById(userId);

    // If no user found, Create an error message
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
    //Send the error to the error handler to manage it
      throw err;  
    }
// If user found, send user data with status 200 (OK)
    res.status(200).send({ user });
  } catch (err) {
    // If any error happens, send it to error handler middleware
    next(err);
  }
};
