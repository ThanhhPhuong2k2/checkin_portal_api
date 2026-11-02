export interface IServiceSettings {
  serviceName: string;
  httpPort: number;
  apiPrefix: string;
}

export interface IMongoSettings {
  mongoUri: string;
  mongoDatabase: string;
  mongoUsername: string;
  mongoPassword: string;
}

export interface ILoggerSettings {
  serviceName: string;
  maxSize: string;
  maxRotate: number | string;
  dirpath: string;
  level: string;
  transport: 'file' | 'all';
}

export interface IHttpSettings {
  identityService: string;
  notificationService: string;
}

export interface IDirectusSettings {
  folderCode: string;
  directusHost: string;
  staticToken: string;
}

export interface IConfig {
  serviceSettings: IServiceSettings;
  mongoSettings: IMongoSettings;
  loggerSettings: ILoggerSettings;
  httpSettings: IHttpSettings;
  directus: IDirectusSettings;
}
