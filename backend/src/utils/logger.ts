import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Define which transports the logger must have
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
      )
    ),
  }),
];

// Add file transport in production
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  // All logs
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/all.log'),
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.level}]: ${info.message}`
        )
      ),
    })
  );

  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.level}]: ${info.message}`
        )
      ),
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  // Exit on error: false to prevent the logger from exiting the process
  exitOnError: false,
});

// Add a method to log API requests
export const logRequest = (req: any) => {
  logger.http(`${req.method} ${req.originalUrl} - ${req.ip}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
};

// Add a method to log API responses
export const logResponse = (req: any, res: any, duration: number) => {
  logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
  });
};

export default logger;