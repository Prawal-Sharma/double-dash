const errorHandler = (err, req, res, next) => {
  // Log the error for debugging (remove in production)
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.details
    };
    res.status(400);
  } else if (err.name === 'UnauthorizedError') {
    error = {
      message: 'Unauthorized access',
      code: 'UNAUTHORIZED'
    };
    res.status(401);
  } else if (err.name === 'ConditionalCheckFailedException') {
    error = {
      message: 'Resource already exists',
      code: 'RESOURCE_EXISTS'
    };
    res.status(409);
  } else if (err.code === 'ResourceNotFoundException') {
    error = {
      message: 'Resource not found',
      code: 'RESOURCE_NOT_FOUND'
    };
    res.status(404);
  } else {
    res.status(500);
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    error.message = error.message || 'Something went wrong';
    delete error.stack;
  }

  res.json({ error: error.message, code: error.code });
};

module.exports = errorHandler;