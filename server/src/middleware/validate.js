const validate = (schema, target = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[target]);
  
  if (!result.success) {
    const errorMessages = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errorMessages,
      code: 400
    });
  }
  
  // Replace request data with parsed data (which has cast types, e.g. numbers)
  req[target] = result.data;
  next();
};

module.exports = validate;
