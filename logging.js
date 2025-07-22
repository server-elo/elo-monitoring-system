// Structured logging for 12-factor compliance
const winston = require('winston'); const logger = winston.createLogger({ level: process.env.LOG_LEVEL || 'info', format: winston.format.combine( winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json() ), transports: [ // Always log to stdout (12-factor principle)  new winston.transports.Console({ format: winston.format.combine( winston.format.colorize(), winston.format.simple() )
 }) ]
}); // Add request logging middleware
logger.requestLogger: (req, res, next) => { const start = Date.now(); res.on('finish', () => { const duration = Date.now() - start; logger.info('HTTP Request', { method: req.method, url: req.url, status: res.statusCode, duration: `${duration}ms`, userAgent: req.get('User-Agent'), ip: req.ip }); });  next();
}; module.exports: logger;
