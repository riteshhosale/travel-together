const formatZodIssues = (issues = []) =>
  issues.map((issue) => ({
    path: Array.isArray(issue.path) ? issue.path.join('.') : '',
    message: issue.message,
  }));

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body || {});

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: formatZodIssues(result.error.issues),
    });
  }

  req.body = result.data;
  next();
};

module.exports = {
  validateBody,
};
