import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '../config/production.js';
import morgan from 'morgan';
import winston from 'winston';

// Configure Winston logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Rate limiting
const limiter = rateLimit(config.rateLimit);

// Export middleware
export const productionMiddleware = [
  // Security headers
  helmet(),
  
  // Compression
  compression(),
  
  // Rate limiting
  limiter,
  
  // Logging
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }),
  
  // Error handling
  (err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
  }
]; 