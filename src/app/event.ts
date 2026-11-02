import { StatusCodes } from 'http-status-codes';
import to from 'await-to-js';
import { ObjectId } from 'mongodb';

import { IEventFilter, IEvent } from 'interface';
import { AppError, Events } from 'model';
import BaseApp from './base';

const where = 'App.event';

export class EventApp extends BaseApp {
  async getPaginate(filters: IEventFilter) {
    const [error, result] = await to(this.getStore().event().getPaginate(filters));

    if (error) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách sự kiện thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    return result;
  }

  async getList(filters: IEventFilter) {
    const [error, result] = await to(this.getStore().event().getList(filters));

    if (error) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách sự kiện thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    return result;
  }

  async getById(eventId: string) {
    try {
      if (!eventId) {
        throw new AppError({
          id: `${where}.getById.invalid`,
          message: 'eventId là bắt buộc',
          statusCode: 400,
        });
      }

      if (!ObjectId.isValid(eventId)) {
        throw new AppError({
          id: `${where}.getById.invalidObjectId`,
          message: 'eventId không hợp lệ',
          statusCode: 400,
        });
      }

      const oid = new ObjectId(eventId);
      const [err, result] = await to(this.getStore().event().getGifts(oid));
      if (err) {
        throw err;
      }
      if (!result) {
        throw new AppError({
          id: `${where}.getById.notfound`,
          message: 'sự kiện không có hoặc chưa tồn tại',
          statusCode: 404,
        });
      }
      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy sự kiện thất bại',
        statusCode: 400,
        detail: error,
      });
    }
  }

  async getByOnGoing(isOngoing: boolean) {
    const [error, data] = await to(
      this.getStore().event().findOne<IEvent>({
        isOngoing,
        deletedAt: null,
      }),
    );

    if (error) {
      throw new AppError({
        id: `${where}.getByOnGoing`,
        message: 'Lấy dữ liệu sự kiện không thành công',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    if (!data) {
      throw new AppError({
        id: `${where}.getByOnGoing`,
        message: 'sự kiện không có hoặc chưa tồn tại',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    return data;
  }

  async create(data: Events) {
    try {
      let eventModel: any;
      if (typeof (Events as any).sequelize === 'function') {
        eventModel = await (Events as any).sequelize(data);
      } else {
        eventModel = new Events({ ...data });
      }

      if (typeof eventModel.preSave === 'function') {
        // eslint-disable-next-line no-useless-catch
        try {
          eventModel.preSave();
        } catch (e) {
          throw e;
        }
      }

      const result = await this.getStore()
        .event()
        .createOne(eventModel as any);
      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo sự kiện thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }

  async update(eventId: string, updateData: any) {
    try {
      if (!ObjectId.isValid(eventId)) {
        throw new AppError({
          id: `${where}.update.invalidId`,
          message: 'eventId không hợp lệ',
          statusCode: 400,
        });
      }

      const oid = new ObjectId(eventId);
      const [findErr, existing] = await to(this.getStore().event().findOne({ _id: oid }));
      if (findErr) throw findErr;
      if (!existing) {
        throw new AppError({
          id: `${where}.update.notfound`,
          message: 'sự kiện không có hoặc chưa tồn tại',
          statusCode: 404,
        });
      }

      updateData.updatedAt = new Date();

      const merged = { ...(existing as any), ...updateData };
      // eslint-disable-next-line global-require
      const eventModel = new Events(merged);

      if (typeof (eventModel as any).preUpdate === 'function') {
        (eventModel as any).preUpdate();
      }

      const [updateErr] = await to(
        (this.getStore().event() as any).updateOne(eventId.toString(), eventModel as any),
      );
      if (updateErr) {
        throw updateErr;
      }

      const [reErr, updated] = await to(this.getStore().event().findOne({ _id: oid }));
      if (reErr) throw reErr;
      return updated;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật sự kiện thất bại',
        statusCode: 400,
        detail: error,
      });
    }
  }

  async delete(eventId: string) {
    try {
      await this.getById(eventId);

      await this.getStore()
        .event()
        .baseUpdate({ _id: new ObjectId(eventId) }, { $set: { deletedAt: new Date() } });
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật sự kiện thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }

  async updateOngoing(eventId: string, onGoing: boolean) {
    try {
      await this.getStore().event().updateGoing(eventId, onGoing);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.updateOngoing`,
        message: 'Cập nhật sự kiện thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }
}
