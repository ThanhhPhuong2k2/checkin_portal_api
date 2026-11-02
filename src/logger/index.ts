import { Logger, createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

import { config } from 'config';
import { ILoggerSettings } from 'interface/config';

class MetaDAPLogger {
  private static instance: MetaDAPLogger;
  private logger: Logger;

  private constructor(loggerConfig: ILoggerSettings) {
    const consoleFormat = format.printf(
      ({ service, level, message, timestamp, data }) =>
        `[${timestamp}][${level}][${service}] ${JSON.stringify({ message, data }, null)}`,
    );

    const transport = new transports.DailyRotateFile({
      filename: `${loggerConfig.serviceName}-%DATE%.log`, // Tên của file log với một mẫu (%DATE%) để tạo tên file dựa trên ngày.
      dirname: loggerConfig.dirpath, // Thư mục  nơi các file log sẽ được lưu trữ.
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true, // các file log cũ sẽ được nén lại.
      maxSize: loggerConfig.maxSize, // Nếu file log vượt quá kích thước 25mb, một file mới sẽ được tạo.
      maxFiles: loggerConfig.maxRotate, // Xóa các file log khi quá 30 ngày,
    });

    const console = new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss:SSSZ' }),
        format.splat(),
        consoleFormat,
      ),
    });
    const logger = createLogger({
      defaultMeta: { service: loggerConfig.serviceName },
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
      },
      level: loggerConfig.level,
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        format.json(),
        consoleFormat,
      ),
      transports: [transport],
    });

    if (loggerConfig.transport === 'all') {
      logger.add(console);
    } else {
      logger.remove(console);
    }

    this.logger = logger;
  }

  static getInstance() {
    const loggerConfig: ILoggerSettings = config.loggerSettings;

    if (!this.instance) {
      this.instance = new MetaDAPLogger(loggerConfig);
    }

    return this.instance;
  }

  info(message: string, data?: any) {
    this.logger.log({ level: 'info', message, data });
  }

  warning(message: string, data?: any) {
    this.logger.log({ level: 'warn', message, data });
  }

  error(message: string, data?: any) {
    this.logger.log({ level: 'error', message, data });
  }

  debug(message: string, data?: any) {
    this.logger.log({ level: 'debug', message, data });
  }
}

export const logger = MetaDAPLogger.getInstance();
