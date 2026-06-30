import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: config.env === 'production' ? combine(timestamp(), json()) : combine(timestamp({ format: 'HH:mm:ss' }), colorize(), devFormat),
  transports: [new winston.transports.Console(), ...(config.env === 'production' ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), new winston.transports.File({ filename: 'logs/combined.log' })] : [])],
});
