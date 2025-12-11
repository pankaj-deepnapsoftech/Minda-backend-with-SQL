import winston from "winston";

// Create a logger
export const logger = winston.createLogger({
  level: 'info', // minimum level of messages to log
  format: winston.format.simple(), // simple text format
  transports: [
    new winston.transports.Console(), // log to console
  ],
});


