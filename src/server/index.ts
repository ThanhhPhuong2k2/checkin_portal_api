import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response, Router } from 'express';
import helmet from 'helmet';
import http from 'http';
import { StatusCodes } from 'http-status-codes';
import morgan from 'morgan';

import { API } from 'api';
import { IConfig } from 'interface';
import { logger } from 'logger';
import * as model from 'model';
import { Services } from 'service';
import MongoStore from 'store';
import i18n from 'i18n';
import 'utils/extension';

export class Server {
  private httpServer: http.Server;
  private config: IConfig;
  private store?: MongoStore;
  private api?: API;
  rootRouter: Router;
  services: Services;

  constructor(config: IConfig) {
    this.config = config;
    this.rootRouter = Router();
    this.httpServer = http.createServer();
    this.services = new Services(config);
  }

  setup = async () => {
    logger.info('Setting store...');
    this.store = await MongoStore.getInstance(this.config);
    logger.info('Setting store success!');

    this.api = new API(this);
    this.api.setup();

    const app = express();
    app.use(helmet());
    app.use(cookieParser());
    app.use(morgan('dev'));
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.use(compression());
    app.disable('x-powered-by');
    app.use(cors());
    app.use(i18n.init);

    app.use(this.config.serviceSettings.apiPrefix, this.rootRouter);
    app.use('*', this.handleNotfound);
    app.use(this.handleError);
    this.httpServer.addListener('request', app);
  };

  private handleNotfound = async (req: Request, res: Response, next: NextFunction) => {
    const error = new model.AppError({
      id: 'api.notfound',
      message: 'Route not found',
      statusCode: StatusCodes.BAD_REQUEST,
    });

    next(error);
  };

  private handleError = async (error: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`HTTP ${req.method} ${req.originalUrl}`, error);

    if (error && error instanceof model.AppError) {
      res.status(error.statusCode);
      error.translate(req.headers['accept-language'] === 'en' ? 'en' : 'vi');
      return res.json(error);
    }

    if (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR);
      return res.json(
        new model.AppError({
          id: 'server',
          message: 'INTERNAL SERVER ERROR',
          detail: error,
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        }),
      );
    }

    next();
  };

  start = async () => {
    if (!this.httpServer.listening) {
      this.httpServer.listen(this.config.serviceSettings.httpPort, () => {
        logger.info(`Http server is running at port ${this.config.serviceSettings.httpPort}`);
      });
    }
  };

  stop = async () => {
    if (this.httpServer.listening) {
      logger.info('Close http server');
      this.httpServer.close();
    }

    logger.info('Close db connection');
    await this.store?.close();
  };

  getConfig = () => this.config;

  getStore = () => {
    if (!this.store) throw new Error('Store is not setup yet');
    return this.store;
  };
}
