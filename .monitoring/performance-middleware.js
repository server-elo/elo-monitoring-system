
const performanceMonitoring = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const metrics = {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
    
    // Log metrics (you can send to monitoring service)
    console.log('Performance:', metrics);
  });
  
  next();
};

module.exports = performanceMonitoring;
