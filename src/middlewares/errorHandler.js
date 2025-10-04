 
const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error("💥 ERROR 💥", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json(
    new ApiResponse(statusCode, null, message)
  );
};

module.exports = errorHandler;