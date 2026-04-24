// Validation middleware

// Validate request body
export function validateBody(schema) {
  return (req, res, next) => {
    // TODO: Implement validation
    next();
  };
}

// Validate UUID
export function validateUUID(req, res, next) {
  // TODO: Implement UUID validation
  next();
}
