import { StatusCodes } from 'http-status-codes';
import to from 'await-to-js';
import { ObjectId } from 'mongodb';

import { IBannerFilter } from 'interface';
import { AppError, Banner } from 'model';
import BaseApp from './base';

const where = 'App.banner';

export class BannerApp extends BaseApp {
  async getPaginate(filters: IBannerFilter) {
    const [error, result] = await to(this.getStore().banner().getPaginate(filters));

    if (error) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách banner thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    return result;
  }

  async getList(filters: IBannerFilter) {
    const [error, result] = await to(this.getStore().banner().getList(filters));

    if (error) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách banner thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    return result;
  }

  async getListByEventId(eventId: ObjectId) {
    const [error, result] = await to(
      this.getStore()
        .banner()
        .find(
          {
            eventId: new ObjectId(eventId),
          },
          {
            _id: 1,
            imageUrl: 1,
            title: 1,
            order: 1,
            logo: 1,
          },
          {
            sort: {
              order: 1,
            },
          },
        ),
    );

    if (error) {
      throw new AppError({
        id: `${where}.getListAll`,
        message: 'Lấy danh sách banner thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    return result;
  }

  async getById(bannerId: string) {
    const [error, data] = await to(this.getStore().banner().findById(bannerId));

    if (error) {
      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu banner không thành công',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    if (!data) {
      throw new AppError({
        id: `${where}.getById`,
        message: 'Banner không có hoặc chưa tồn tại',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    return data;
  }

  async create(data: Banner) {
    try {
      const totalBanner = await this.getStore()
        .banner()
        .countDocuments({ eventId: new ObjectId(data.eventId) });
      data.order = totalBanner + 1;

      const result = await this.getStore().banner().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo banner thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }

  swapOrder = async (currentId: string, nextId: string) => {
    try {
      const [prev, next] = await Promise.all([
        this.getStore().banner().findById(currentId),
        this.getStore().banner().findById(nextId),
      ]);

      if (!prev || !next) {
        throw new AppError({
          id: `${where}.swapOrder`,
          message: 'Banner không tồn tại trong hệ thống',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      await this.getStore()
        .banner()
        .swapOrder(
          { id: currentId, order: Number(prev.order) },
          { id: nextId, order: Number(next.order) },
        );
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.swapOrder`,
        message: 'Cập nhập vị trí banner thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  };

  async update(bannerId: string, data: Banner) {
    try {
      const oldBanner = await this.getById(bannerId);

      const result = await this.getStore().banner().updateOne(bannerId, data);

      if (oldBanner.imageUrl !== result.imageUrl) {
        this.getServices().directus.deleteByPaths([oldBanner.imageUrl]);
      }

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật banner thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }

  async delete(bannerId: string) {
    try {
      const oldBanner = await this.getById(bannerId);

      await this.getStore()
        .banner()
        .baseDelete({ _id: new ObjectId(bannerId) });

      this.getServices().directus.deleteByPaths([oldBanner.imageUrl]);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật banner thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }
}
