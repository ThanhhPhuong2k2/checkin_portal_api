import to from 'await-to-js';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { AppError } from 'model';
import { EPermissions } from 'interface';

export const authorization = (permissions: EPermissions[]) => {
  const middleware = async (ctx: Context, req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization as string;

      const [error] = await to(
        ctx.services.MetaDAP.identity().checkPermissions(permissions, token),
      );

      if (error) {
        throw new AppError({
          id: 'middleware.authorization',
          message: 'Bạn không đủ quyền thực hiện chức năng này',
          statusCode: StatusCodes.FORBIDDEN,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  return middleware;
};
