import to from 'await-to-js';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { isArray, isString } from 'lodash';

import { Context } from 'api';
import { AppError } from 'model';
import { removeFileLocal } from 'utils';

const where = 'upload';

export async function uploadFile(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file?.path) {
      throw new AppError({
        id: `${where}.uploadFile`,
        message: 'upload file thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const [error, data] = await to(ctx.services.directus.uploadFile(req.file));

    if (error) {
      console.error('❌ [HANDLER] Lỗi Directus Service:', JSON.stringify(error, null, 2));
    }

    if (error || !data.path) {
      throw new AppError({
        id: `${where}.uploadFile`,
        message: 'upload file thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    res.json({ data });
  } catch (error) {
    console.error('❌ [HANDLER] Catch Error:', error);
    next(error);
  } finally {
    if (req.file?.path) removeFileLocal(req.file.path);
  }
}

export async function uploadFiles(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const files = isArray(req.files) ? req.files : [];

    if (!files.length) {
      throw new AppError({
        id: `${where}.uploadFile`,
        message: 'upload file thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const [error, data] = await to(Promise.all(files.map(ctx.services.directus.uploadFile)));

    if (error || !data) {
      throw new AppError({
        id: `${where}.uploadFile`,
        message: 'upload file thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  } finally {
    if (req.file?.path) removeFileLocal(req.file.path);
  }
}

export async function importFile(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { url, folder } = req.body;

    if (!url || !folder || !isString(url) || !isString(folder)) {
      throw new AppError({
        id: `${where}.importFile`,
        message: 'Dữ liệu không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const [error, data] = await to(ctx.services.directus.importFile(url, folder));

    if (error || !data.path) {
      throw new AppError({
        id: `${where}.importFile`,
        message: 'upload file thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    res.json({ data });
  } catch (error) {
    next(error);
  } finally {
    if (req.file?.path) removeFileLocal(req.file.path);
  }
}

export async function patchFile(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const fileId = req.params.fileId;

    if (!fileId) {
      throw new AppError({
        id: `${where}.patchFile`,
        message: 'Vui lòng gửi file id',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (!req.file?.path) {
      throw new AppError({
        id: `${where}.patchFile`,
        message: 'upload file thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const [error, data] = await to(ctx.services.directus.patchFile(fileId, req.file));

    if (error || !data.path) {
      throw new AppError({
        id: `${where}.patchFile`,
        message: 'upload file thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    res.json({ data });
  } catch (error) {
    next(error);
  } finally {
    if (req.file?.path) removeFileLocal(req.file.path);
  }
}

export async function removeFile(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const paths = req.body.paths;

    if (!Array.isArray(paths) || !paths.length) {
      throw new AppError({
        id: `${where}.removeFile`,
        message: 'dường dẫn không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    paths.forEach((path) => {
      if (!isString(path) || !path) {
        throw new AppError({
          id: `${where}.removeFile`,
          message: 'dường dẫn không hợp lệ',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
    });

    await ctx.services.directus.deleteByPaths(paths);

    res.json('ok');
  } catch (error) {
    next(error);
  }
}
