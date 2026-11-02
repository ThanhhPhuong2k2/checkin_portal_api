import { Request, Response, NextFunction, Router } from 'express';

import { Server } from 'server';
import { logger } from 'logger';
import * as apiV1 from './rest/v1';

export type Context = Server;

class BaseRoutes {
  private root: Router;
  private v1: Router = Router();

  upload: Router = Router();
  banners: Router = Router();
  events: Router = Router();
  gifts: Router = Router();
  guest: Router = Router();

  constructor(rootRouter: Router) {
    this.root = rootRouter;
    this.root.use('/v1', this.v1);

    this.v1.use('/upload', this.upload);
    this.v1.use('/banners', this.banners);
    this.v1.use('/gifts', this.gifts);
    this.v1.use('/events', this.events);
    this.v1.use('/guest', this.guest);
  }
}

export class API {
  baseRoutes: BaseRoutes;
  server: Server;

  constructor(server: Server) {
    this.server = server;
    this.baseRoutes = new BaseRoutes(server.rootRouter);
  }

  setup = () => {
    apiV1.initUpload(this);
    apiV1.initBanner(this);
    apiV1.initEvent(this);
    apiV1.initGift(this);
    apiV1.initGuest(this);

    logger.info('Setup api success!');
  };

  handler = (
    h: (ctx: Context, r: Request<any, any, any, any>, w: Response, n: NextFunction) => void,
  ) => {
    return (req: Request, res: Response, next: NextFunction) => {
      h(this.server, req, res, next);
    };
  };
}
