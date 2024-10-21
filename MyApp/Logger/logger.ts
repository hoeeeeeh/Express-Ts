import fs from 'fs';
import moment from 'moment-timezone';
import winston from 'winston';
import 'winston-daily-rotate-file';
import process from 'process';
import path from 'path';

const rel = process.env.LOG_DIR || '/log';
const logDir = path.join(process.cwd(), rel);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

function formatWithColorized(originalFormat: winston.Logform.Format) {
  return winston.format.combine(
    originalFormat,
    winston.format.colorize({ all: true }),
  );
}

const infoTransport = new winston.transports.DailyRotateFile({
  filename: 'info.log',
  dirname: logDir,
  level: 'info',
  maxFiles: '30d', // 30일치 저장,
  format,
});

const errorTransport = new winston.transports.DailyRotateFile({
  filename: 'error.log',
  dirname: logDir,
  level: 'error',
  maxFiles: '30d', // 30일치 저장
  format,
});

moment.tz.setDefault('Asia/Seoul'); // 로그 시간대 한국 기준으로 변경
// const timeStamp = () => moment().format('YYYY-MM-DD HH:mm:ss');

const logger = winston.createLogger({
  transports: [infoTransport, errorTransport],
});

const colorizedFormat = formatWithColorized(format);
const console = new winston.transports.Console({ format: colorizedFormat });

logger.add(console);

export { logger };
