import { Context } from 'api';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AppError } from 'model';

declare module 'express' {
  export interface Request {
    user?: any;
    typeUser?: string;
  }
}

export const authentication = (type: 'user' | 'admin' | 'all') => {
  const middleware = async (ctx: Context, req: Request, res: Response, next: NextFunction) => {
    try {
      const authorization = req.headers.authorization as string;

      if (!authorization) {
        return next(
          new AppError({
            id: 'middleware.authentication',
            message: 'Access Token không hợp lệ',
            statusCode: StatusCodes.UNAUTHORIZED,
            detail: 'Invalid access token',
          }),
        );
      }

      let user: any = null;

      if (type === 'all') {
        const [cUser, cAdmin] = await Promise.all([
          ctx.services.MetaDAP.identity().checkAuthenticate('user', authorization),
          ctx.services.MetaDAP.identity().checkAuthenticate('admin', authorization),
        ]);

        user = cUser || cAdmin;
      } else {
        user = await ctx.services.MetaDAP.identity().checkAuthenticate(type, authorization);
      }

      if (!user) {
        return next(
          new AppError({
            id: 'middleware.authentication',
            message: 'Người dùng không tồn tại',
            statusCode: StatusCodes.UNAUTHORIZED,
            detail: 'Invalid user',
          }),
        );
      }

      req.user = user;
      req.typeUser = type;

      next();
    } catch (error) {
      return res.status(StatusCodes.UNAUTHORIZED).json(
        new AppError({
          id: 'middleware.authentication',
          message: 'Người dùng không tồn tại',
          statusCode: StatusCodes.UNAUTHORIZED,
        }),
      );
    }
  };

  return middleware;
};
