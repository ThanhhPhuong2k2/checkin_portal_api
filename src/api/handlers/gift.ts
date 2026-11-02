import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { GiftApp } from 'app';
import { IGiftFilter } from 'interface';
import { AppError, Gift } from 'model';
import { isValidId, tryParseJson, validatePagination } from 'utils';

const where = 'Handlers.gift';

export async function createGift(ctx: any, req: Request, res: Response): Promise<void> {
  try {
    const body = { ...req.body };

    if ('eventId' in body) delete body.eventId;

    const app = new GiftApp(ctx);
    const gift = await app.create(body);

    res.json({
      success: true,
      message: 'Tạo quà tặng thành công',
      data: gift,
    });
  } catch (err) {
    const status = (err as any)?.statusCode ?? 500;

    res.status(status).json({
      id: 'handlers.gift.create',
      message: 'Tạo quà tặng thất bại',
      detail: err,
    });
  }
}
export async function swapOrder(ctx: Context, req: Request, res: Response, next: NextFunction) {
  try {
    const { currentId, nextId } = req.body;

    if (!isValidId(currentId) || !isValidId(nextId)) {
      throw new AppError({
        id: `${where}.swapOrder`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    await new GiftApp(ctx).swapOrder(currentId, nextId);
    res.json({
      message: 'ok',
    });
  } catch (err) {
    next(err);
  }
}

export async function getPagination(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { limit = 10, page = 1, order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IGiftFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    await validatePagination(filters.page, filters.limit);

    const result = await new GiftApp(ctx).getPaginate(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAll(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IGiftFilter = { ...filterObject, order, sort };

    const result = await new GiftApp(ctx).getList(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDetail(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const giftId = req.params.giftId as string;

    if (!isValidId(giftId)) {
      throw new AppError({
        id: `${where}.getDetail`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new GiftApp(ctx).getById(giftId);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateGift(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const giftId = req.params.giftId as string;

    if (!isValidId(giftId)) {
      throw new AppError({
        id: `${where}.updateGift`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await Gift.sequelize(req.body);

    const result = await new GiftApp(ctx).update(giftId, data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteGift(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const giftId = req.params.giftId as string;

    if (!isValidId(giftId)) {
      throw new AppError({
        id: `${where}.deleteGift`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new GiftApp(ctx).delete(giftId);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
