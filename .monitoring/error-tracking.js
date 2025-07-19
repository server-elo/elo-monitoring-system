
const errorTracking = (err, req, res, next) => {
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  };
  
  // Log error (you can send to monitoring service)
  console.error('Error tracked:', errorInfo);
  
  // Continue with default error handling
  next(err);
};

module.exports = errorTracking;
