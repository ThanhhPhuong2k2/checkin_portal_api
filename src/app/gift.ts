import { StatusCodes } from 'http-status-codes';
import to from 'await-to-js';
import { ObjectId } from 'mongodb';

import { IGiftFilter } from 'interface';
import { AppError, Gift } from 'model';
import BaseApp from './base';

const where = 'App.gift';

export class GiftApp extends BaseApp {
  async getPaginate(filters: IGiftFilter) {
    const [error, result] = await to(this.getStore().gift().getPaginate(filters));

    if (error) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách quà tặng thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    return result;
  }

  async getList(filters: IGiftFilter) {
    const [error, result] = await to(this.getStore().gift().getList(filters));

    if (error) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách quà tặng thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    return result;
  }

  async getById(id: string) {
    const [error, data] = await to(this.getStore().gift().findById(id));

    if (error) {
      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu quà tặng không thành công',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    if (!data) {
      throw new AppError({
        id: `${where}.getById`,
        message: 'Quà tặng không có hoặc chưa tồn tại',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    return data;
  }

  async create(data: Gift) {
    try {
      const total = await this.getStore().gift().countDocuments();
      data.order = total + 1;

      const giftModel = new Gift({
        ...data,
        order: data.order,
      } as any);

      const result = await this.getStore().gift().createOne(giftModel);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo quà tặng thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }

  swapOrder = async (currentId: string, nextId: string) => {
    try {
      const [prev, next] = await Promise.all([
        this.getStore().gift().findById(currentId),
        this.getStore().gift().findById(nextId),
      ]);

      if (!prev || !next) {
        throw new AppError({
          id: `${where}.swapOrder`,
          message: 'Quà tặng không tồn tại trong hệ thống',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      await this.getStore()
        .gift()
        .swapOrder(
          { id: currentId, order: Number(prev.order) },
          { id: nextId, order: Number(next.order) },
        );
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.swapOrder`,
        message: 'Cập nhập vị trí quà tặng thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  };

  async update(giftId: string, data: Gift) {
    try {
      const older = await this.getById(giftId);

      const result = await this.getStore().gift().updateOne(giftId, data);

      if (older.imageUrl !== result.imageUrl) {
        this.getServices().directus.deleteByPaths([older.imageUrl]);
      }

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật quà tặng thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }

  async delete(giftId: string) {
    try {
      const older = await this.getById(giftId);

      await this.getStore()
        .gift()
        .baseDelete({ _id: new ObjectId(giftId) });

      this.getServices().directus.deleteByPaths([older.imageUrl]);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật quà tặng thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }
}
