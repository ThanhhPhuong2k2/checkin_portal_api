import dotenv from 'dotenv';
import { IConfig } from 'interface/config';

dotenv.config();

export const config: IConfig = {
  serviceSettings: {
    serviceName: process.env.SERVICE_NAME || 'checkin-portal-api',
    httpPort: parseInt(process.env.HTTP_PORT || '9000', 10),
    apiPrefix: process.env.API_PREFIX || '',
  },
  mongoSettings: {
    mongoUri: process.env.MONGO_HOST || '',
    mongoDatabase: process.env.MONGO_DATABASE || '',
    mongoUsername: process.env.MONGO_USERNAME || '',
    mongoPassword: process.env.MONGO_PASSWORD || '',
  },
  loggerSettings: {
    serviceName: process.env.SERVICE_NAME || 'checkin-portal-api',
    maxSize: process.env.LOG_SIZE || '25m',
    maxRotate: Number(process.env.LOG_ROTATE) || '30d',
    level: process.env.LOG_LEVEL || 'info',
    dirpath: process.env.LOG_FOLDER || './logs',
    transport: process.env.LOG_TRANSPORT === 'all' ? 'all' : 'file',
  },
  httpSettings: {
    identityService: process.env.IDENTITY_SERVICE || '',
    notificationService: process.env.NOTIFICATION_SERVICE || '',
  },
  directus: {
    directusHost: process.env.DIRECTUS_HOST || '',
    staticToken: process.env.DIRECTUS_TOKEN || '',
    folderCode: process.env.DIRECTUS_FOLDER || '',
  },
};
