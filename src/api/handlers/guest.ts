import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { GuestApp } from 'app';
import { IGuestFilter } from 'interface';
import { AppError } from 'model';
import { isValidId, tryParseJson, validateExportTime, validatePagination } from 'utils';
import moment from 'moment';

const where = 'Handlers.guest';

export async function create(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const app = new GuestApp(ctx);
    const result = await app.create(req.body);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
export async function createUser(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const app = new GuestApp(ctx);
    const result = await app.createUser(req.body);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getGuestByQr(ctx: any, req: any, res: any, next: any): Promise<void> {
  try {
    const { qrToken } = req.body;
    if (!qrToken) {
      return next(
        new AppError({
          id: 'handlers.guest.getGuestByQr.missing',
          message: 'Missing qrToken',
          statusCode: StatusCodes.BAD_REQUEST,
        }),
      );
    }

    const app = new GuestApp(ctx);
    // Gọi phương thức chỉ tìm kiếm
    const result = await app.getGuestByQr(qrToken);

    return res.json(result);
  } catch (err) {
    return next(err);
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

    const filters: IGuestFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    await validatePagination(filters.page, filters.limit);

    const result = await new GuestApp(ctx).getPaginate(filters);

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

    const filters: IGuestFilter = { ...filterObject, order, sort };

    const result = await new GuestApp(ctx).getList(filters);

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
    const guestId = req.params.guestId as string;

    if (!isValidId(guestId)) {
      throw new AppError({
        id: `${where}.getDetail`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new GuestApp(ctx).getById(guestId);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function exportGuest(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IGuestFilter = {
      ...filterObject,
      ...(req.body as IGuestFilter),
      order,
      sort,
    };

    if (filters.start && filters.end) {
      await validateExportTime(filters.start, filters.end);
    }

    const workbook = await new GuestApp(ctx).export(filters);

    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="guests-${moment().format('YYYYMMDD_HHmmss')}.xlsx"`,
    );

    await workbook.xlsx.write(res);

    // eslint-disable-next-line no-useless-return
    return;
  } catch (err) {
    next(err);
  }
}

export async function updateAdmin(ctx: any, req: Request, res: Response): Promise<void> {
  try {
    const guestId = req.params.guestId as string;
    if (!guestId) {
      res.status(400).json({
        id: 'handlers.guest.updateAdmin.invalidId',
        message: 'guestId là bắt buộc (params.id)',
      });
      return;
    }

    if (req.body && 'createBy' in req.body) {
      delete req.body.createBy;
    }

    const app = new GuestApp(ctx);
    const result = await app.update(guestId, req.body);

    res.json({
      success: true,
      message: 'Cập nhật guest thành công',
      data: result,
    });
  } catch (err: any) {
    const status = err && err.statusCode ? err.statusCode : 500;
    res.status(status).json({
      id: 'handlers.guest.updateAdmin',
      message: 'Lỗi khi cập nhật guest',
      detail: err,
    });
  }
}
export async function deleteAdmin(ctx: any, req: Request, res: Response): Promise<void> {
  try {
    const guestId = req.params.id || req.body?._id;

    if (!guestId) {
      res.status(400).json({
        id: 'handlers.guest.deleteAdmin.invalidId',
        message: 'guestId là bắt buộc',
      });
      return;
    }

    const app = new GuestApp(ctx);
    const result = await app.delete(guestId);

    res.json({
      success: true,
      message: 'Xoá guest thành công',
      data: result,
    });
  } catch (err) {
    const status = (err as any)?.statusCode ?? 500;

    res.status(status).json({
      id: 'handlers.guest.deleteAdmin',
      message: 'Lỗi khi xoá guest',
      detail: err,
    });
  }
}

export async function statusGuest(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const guestId = req.params.guestId as string;

    const sttGuest = req.body.statusGuest as boolean;
    if (!isValidId(guestId)) {
      throw new AppError({
        id: `${where}.statusGuest`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    await new GuestApp(ctx).statusGuest(guestId, sttGuest);

    res.json('ok');
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateGuest(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { eventId, guests } = req.body;

    if (!eventId || !Array.isArray(guests)) {
      return next(
        new AppError({
          id: `${where}.bulkCreate.missing`,
          message: 'Thiếu Event ID hoặc danh sách khách mời (Guests Array)',
          statusCode: StatusCodes.BAD_REQUEST,
        }),
      );
    }

    const app = new GuestApp(ctx);

    const result = await app.bulkCreateGuests(eventId, guests);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getUniqueTypeGuests(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;

    if (!eventId) {
      throw new AppError({
        id: `${where}.getUniqueTypeGuests.missingId`,
        message: 'Vui lòng cung cấp ID sự kiện.',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (!isValidId(eventId)) {
      throw new AppError({
        id: `${where}.getUniqueTypeGuests.invalidId`,
        message: 'ID sự kiện không hợp lệ.',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const app = new GuestApp(ctx);

    const result = await app.getUniqueTypeGuests(eventId);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
