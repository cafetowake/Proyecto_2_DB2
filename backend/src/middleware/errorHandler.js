// Global error handler middleware

export function errorHandler(err, req, res, next) {
  // TODO: Implement error handling
  console.error(err);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}
