// controllers/errors.handlers.js

// Handle requests to paths that don't exist
const notFoundHandler = (req, res, next) => {
  res.status(404).send({ msg: "Path not found" });
};

// Handle any other errors in the app
const errorHandler = (err, req, res, next) => {
  console.error(err);
// Use error info if available, otherwise use default
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

   // Send error info to client
  res.status(status).send({ msg: message });
};

module.exports = { notFoundHandler, errorHandler };
