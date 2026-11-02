import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { EventApp, BannerApp } from 'app';
import { IEventFilter } from 'interface';
import { AppError } from 'model';
import { isValidId, tryParseJson, validatePagination } from 'utils';
import { ObjectId } from 'mongodb';

const where = 'Handlers.event';

export async function createEvent(ctx: any, req: Request, res: Response): Promise<void> {
  try {
    const body = { ...req.body };
    if (Array.isArray(body.giftIds)) {
      body.giftIds = Array.from(new Set(body.giftIds.map(String)));
    } else {
      body.giftIds = [];
    }

    const app = new EventApp(ctx);
    const created = await app.create(body);

    res.json({ success: true, data: created });
  } catch (err: any) {
    const status = (err as any)?.statusCode ?? 500;
    res.status(status).json({ id: 'handlers.event.create', message: 'Error', detail: err });
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

    const filters: IEventFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    await validatePagination(filters.page, filters.limit);

    const result = await new EventApp(ctx).getPaginate(filters);

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

    const filters: IEventFilter = { ...filterObject, order, sort };

    const result = await new EventApp(ctx).getList(filters);

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
    const eventId = req.params.eventId as string;

    if (!isValidId(eventId)) {
      throw new AppError({
        id: `${where}.getDetail`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new EventApp(ctx).getById(eventId);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEventActive(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const event = await new EventApp(ctx).getByOnGoing(true);
    if (!event?._id) {
      throw new AppError({
        id: `${where}.getEventActive`,
        message: 'Event không tồn tại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const banner = await new BannerApp(ctx).getListByEventId(event?._id);
    res.json({
      ...event,
      banner,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(ctx: any, req: Request, res: Response): Promise<void> {
  try {
    const idFromParams = (req.params && (req.params.eventId || req.params.id)) as
      | string
      | undefined;
    const idFromBody = req.body && req.body._id ? String(req.body._id) : undefined;
    const eventId = (idFromParams || idFromBody || '').toString();

    if (!eventId) {
      res.status(400).json({
        id: 'handlers.event.update.invalidId',
        message: 'eventId là bắt buộc (params.eventId hoặc body._id)',
      });
      return;
    }

    if (!ObjectId.isValid(eventId)) {
      res
        .status(400)
        .json({ id: 'handlers.event.update.invalidObjectId', message: 'eventId không hợp lệ' });
      return;
    }

    const payload = { ...req.body };
    delete payload._id;

    if (Array.isArray(payload.giftIds)) {
      payload.giftIds = Array.from(new Set(payload.giftIds.map(String)));
    }

    const app = new EventApp(ctx);
    const updated = await app.update(eventId, payload);

    res.json({ success: true, message: 'Cập nhật event thành công', data: updated });
  } catch (err: any) {
    const status = (err as any)?.statusCode ?? 500;
    res.status(status).json({
      id: 'handlers.event.update',
      message: 'Error',
      detail: err && err.detail ? err.detail : { message: err?.message ?? err },
    });
  }
}

export async function deleteEvent(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;

    if (!isValidId(eventId)) {
      throw new AppError({
        id: `${where}.deleteEvent`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new EventApp(ctx).delete(eventId);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateOngoing(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;

    const onGoing = req.body.onGoing as boolean;
    if (!isValidId(eventId)) {
      throw new AppError({
        id: `${where}.updateOngoing`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    await new EventApp(ctx).updateOngoing(eventId, onGoing);

    res.json('ok');
  } catch (error) {
    next(error);
  }
}
