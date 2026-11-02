import ExcelJS from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { ObjectId } from 'mongodb';

import { AppError, Guest } from 'model';
import { EActionBy, IGuest, IGuestFilter } from 'interface';
import to from 'await-to-js';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import BaseApp from './base';

const where = 'App.guest';
const QR_CODE_PREFIX = 'data:image/png;base64,';

export class GuestApp extends BaseApp {
  async create(data: Guest) {
    try {
      let eventIdObj: ObjectId;
      if (typeof data.eventId === 'string') {
        try {
          eventIdObj = new ObjectId(data.eventId);
          data.eventId = eventIdObj;
        } catch (err) {
          throw new AppError({
            id: `${where}.create.invalidEventId`,
            message: 'Invalid eventId, must be ObjectId',
            statusCode: StatusCodes.BAD_REQUEST,
          });
        }
      } else {
        eventIdObj = data.eventId as ObjectId;
      }
      const event = await this.getStore()
        .event()
        .findOne({ _id: new ObjectId(eventIdObj), deletedAt: null });

      if (!event) {
        throw new AppError({
          id: `${where}.create`,
          message: 'This event was not found.',
          statusCode: StatusCodes.BAD_REQUEST,
          detail: data,
        });
      }

      try {
        const token = uuidv4();
        data.qrToken = token;
        const qrContent = token;
        data.imageQrUrl = await QRCode.toDataURL(qrContent);
      } catch (err) {
        throw new AppError({
          id: `${where}.create.qr`,
          message: 'QR code generation failed',
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          detail: err,
        });
      }

      if (data.statusGuest === undefined || data.statusGuest === null) {
        data.statusGuest = false;
      }

      const guestModel = new Guest({
        ...data,
        createBy: EActionBy.Admin,
      });

      if (typeof (guestModel as any).preSave === 'function') {
        // eslint-disable-next-line no-useless-catch
        try {
          (guestModel as any).preSave();
        } catch (e) {
          throw e;
        }
      }

      const result = await this.getStore()
        .guest()
        .createOne(guestModel as any);
      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.create`,
        message: 'Registration failed',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }
  async createUser(data: Guest) {
    try {
      let eventIdObj: ObjectId;
      if (typeof data.eventId === 'string') {
        try {
          eventIdObj = new ObjectId(data.eventId);
          data.eventId = eventIdObj;
        } catch (err) {
          throw new AppError({
            id: `${where}.create.invalidEventId`,
            message: 'Invalid eventId, must be ObjectId',
            statusCode: StatusCodes.BAD_REQUEST,
          });
        }
      } else {
        eventIdObj = data.eventId as ObjectId;
      }
      const event = await this.getStore()
        .event()
        .findOne({ _id: new ObjectId(eventIdObj), deletedAt: null });

      if (!event) {
        throw new AppError({
          id: `${where}.create`,
          message: 'This event was not found.',
          statusCode: StatusCodes.BAD_REQUEST,
          detail: data,
        });
      }

      const isExist = await this.getStore()
        .guest()
        .findOne({ name: data.name, phoneNumber: data.phoneNumber });

      if (isExist) return isExist;

      try {
        const token = uuidv4();
        data.qrToken = token;
        const qrContent = token;
        data.imageQrUrl = await QRCode.toDataURL(qrContent);
      } catch (err) {
        throw new AppError({
          id: `${where}.create.qr`,
          message: 'QR code generation failed',
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          detail: err,
        });
      }

      if (data.statusGuest === undefined || data.statusGuest === null) {
        data.statusGuest = false;
      }

      const guestModel = new Guest({
        ...data,
        createBy: EActionBy.User,
      });

      if (typeof (guestModel as any).preSave === 'function') {
        // eslint-disable-next-line no-useless-catch
        try {
          (guestModel as any).preSave();
        } catch (e) {
          throw e;
        }
      }

      const result = await this.getStore()
        .guest()
        .createOne(guestModel as any);
      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.create`,
        message: 'Registration failed',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }
  async getGuestByQr(qrToken: string) {
    if (!qrToken || typeof qrToken !== 'string') {
      throw new AppError({
        id: `${where}.getGuestByQr.invalid`,
        message: 'qrToken is required and must be a string.',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const token = qrToken.trim();

    const [err, guest] = await to(
      this.getStore().guest().findOne({ qrToken: token, deletedAt: null }),
    );

    if (err) {
      throw new AppError({
        id: `${where}.getGuestByQr.find`,
        message: 'Failed to find the guest.',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: { message: err?.message ?? String(err) },
      });
    }

    if (!guest) {
      throw new AppError({
        id: `${where}.getGuestByQr.notfound`,

        message: 'The QR code is invalid or has been deleted.',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    if (!guest._id) {
      throw new AppError({
        id: `${where}.getGuestByQr.update`,
        message: 'Error updating check-in status',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const [reErr, foundGuestWithEvent] = await to(this.getStore().guest().getEvent(guest._id));
    if (reErr) {
      throw new AppError({
        id: `${where}.getGuestByQr.findAfterGetEvent`,
        message: 'Error retrieving record after find.',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: { message: reErr?.message ?? String(reErr) },
      });
    }

    return foundGuestWithEvent;
  }
  async getPaginate(filters: IGuestFilter) {
    const [error, result] = await to(this.getStore().guest().getPaginate(filters));

    if (error) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách người dùng thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    return result;
  }
  async getList(filters: IGuestFilter) {
    const [error, result] = await to(this.getStore().guest().getList(filters));

    if (error) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách người dùng thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    return result;
  }
  async getById(guestId: string) {
    const [error, data] = await to(this.getStore().guest().getEvent(new ObjectId(guestId)));

    if (error) {
      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ người dùng không thành công',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    if (!data) {
      throw new AppError({
        id: `${where}.getById`,
        message: 'Người dùng không có hoặc chưa tồn tại',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    return data;
  }
  async getOne(filters: IGuestFilter) {
    const [error, data] = await to(this.getStore().guest().getOne(filters));

    if (error) {
      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ người dùng không thành công',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }

    if (!data) {
      throw new AppError({
        id: `${where}.getById`,
        message: 'Người dùng không có hoặc chưa tồn tại',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
  }

  private ensureFilterIds(filters: IGuestFilter): IGuestFilter {
    if (filters.events && Array.isArray(filters.events)) {
      filters.events = filters.events
        .filter((id) => id && ObjectId.isValid(id))
        .map((id) => new ObjectId(id)) as any;
    }

    return filters;
  }
  async export(filters: IGuestFilter) {
    try {
      const validatedFilters = this.ensureFilterIds(filters);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Guests');

      worksheet.columns = [
        { header: 'STT', key: 'index', width: 3 },
        { header: 'Họ tên', key: 'name', width: 30 },
        { header: 'Số điện thoại', key: 'phoneNumber', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Chức vụ', key: 'roleGuest', width: 30 },
        { header: 'Hạng', key: 'typeGuest', width: 30 },
        { header: 'Tên công ty', key: 'nameCompany', width: 30 },
        { header: 'Hình QR', key: 'imageQrUrl', width: 30 },
      ];

      const guests = await this.getStore().guest().getList(validatedFilters);

      const rows = guests.map((guest, index) => ({
        index: index + 1,
        name: guest.name || '-',
        phoneNumber: guest.phoneNumber || '-',
        email: guest.email || '-',
        roleGuest: guest.roleGuest || '-',
        typeGuest: guest.typeGuest || '-',
        nameCompany: guest.nameCompany || '-',
      }));

      worksheet.addRows(rows);
      const qrColIndex = 8;

      guests.forEach((guest, index) => {
        const imageQrUrl = guest.imageQrUrl;

        if (imageQrUrl && imageQrUrl.startsWith(QR_CODE_PREFIX)) {
          const base64Data = imageQrUrl.substring(QR_CODE_PREFIX.length);

          const imageBuffer = Buffer.from(base64Data, 'base64');

          const typedImageBuffer = imageBuffer as Buffer;

          const imageId = workbook.addImage({
            buffer: typedImageBuffer as any,
            extension: 'png',
          });

          const rowNum = index + 2;

          worksheet.addImage(imageId, {
            tl: { col: qrColIndex - 1, row: rowNum - 1 + 0.1 },
            ext: { width: 200, height: 200 },
          });

          worksheet.getRow(rowNum).height = 200;
        }
      });

      return workbook;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.export`,
        message: 'Xuất báo cáo thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }
  async update(guestId: string, updateData: any) {
    try {
      if (!guestId) {
        throw new AppError({
          id: `${where}.update.invalidId`,
          message: 'guestId is required',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      if (updateData.eventId && typeof updateData.eventId === 'string') {
        try {
          updateData.eventId = new ObjectId(updateData.eventId);
        } catch (err) {
          throw new AppError({
            id: `${where}.update.invalidEventId`,
            message: 'Invalid eventId, must be ObjectId',
            statusCode: StatusCodes.BAD_REQUEST,
          });
        }
      }

      const [findErr, existing] = await to(
        this.getStore()
          .guest()
          .findOne({ _id: new ObjectId(guestId) }),
      );
      if (findErr) {
        throw new AppError({
          id: `${where}.update.find`,
          message: 'Error finding guest',
          statusCode: StatusCodes.BAD_REQUEST,
          detail: findErr,
        });
      }
      if (!existing) {
        throw new AppError({
          id: `${where}.update.notfound`,
          message: 'No guests found',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      if ('createBy' in updateData) {
        delete updateData.createBy;
      }

      updateData.updatedAt = new Date();

      const merged = {
        ...(existing as any),
        ...updateData,
      };

      const guestModel = new Guest(merged);

      if (typeof (guestModel as any).preUpdate === 'function') {
        // eslint-disable-next-line no-useless-catch
        try {
          (guestModel as any).preUpdate();
        } catch (e) {
          throw e;
        }
      }

      const [updateErr] = await to(
        (this.getStore().guest() as any).updateOne(guestId.toString(), guestModel as any),
      );
      if (updateErr) {
        throw new AppError({
          id: `${where}.update.store`,
          message: 'Error updating guest',
          statusCode: StatusCodes.BAD_REQUEST,
          detail: updateErr,
        });
      }

      const [reErr, updated] = await to(
        this.getStore()
          .guest()
          .findOne({ _id: new ObjectId(guestId) }),
      );
      if (reErr) {
        throw new AppError({
          id: `${where}.update.findAfter`,
          message: 'Error retrieving record after update',
          statusCode: StatusCodes.BAD_REQUEST,
          detail: reErr,
        });
      }

      return updated;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError({
        id: `${where}.update`,
        message: 'Update failure guest',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }
  async delete(guestId: string) {
    try {
      if (!guestId) {
        throw new AppError({
          id: `${where}.delete.invalidId`,
          message: 'guestId is required',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const [findErr, existing] = await to(
        this.getStore()
          .guest()
          .findOne({ _id: new ObjectId(guestId) }),
      );
      if (findErr) {
        throw new AppError({
          id: `${where}.delete.find`,
          message: 'Error finding guest',
          statusCode: StatusCodes.BAD_REQUEST,
          detail: findErr,
        });
      }

      if (!existing) {
        throw new AppError({
          id: `${where}.delete.notfound`,
          message: 'Guest not found',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      let deletePromise: Promise<any>;

      const store = this.getStore().guest() as any;

      if (typeof store.deleteOne === 'function') {
        deletePromise = store.deleteOne(guestId.toString());
      } else if (typeof store.removeOne === 'function') {
        deletePromise = store.removeOne(guestId.toString());
      } else if (store.collection && typeof store.collection.deleteOne === 'function') {
        deletePromise = store.collection.deleteOne({ _id: new ObjectId(guestId) });
      } else {
        throw new AppError({
          id: `${where}.delete.unsupported`,
          message: 'Store does not support deleteOne/removeOne',
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
      }

      const [delErr] = await to(deletePromise);

      if (delErr) {
        throw new AppError({
          id: `${where}.delete.store`,
          message: 'Cannot delete guest',
          statusCode: StatusCodes.BAD_REQUEST,
          detail: delErr,
        });
      }

      return { _id: guestId, deleted: true, hardDeleted: true };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError({
        id: `${where}.delete`,
        message: 'Delete guest failed',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }
  async statusGuest(guestId: string, statusGuest: boolean) {
    try {
      await this.getStore().guest().statusGuest(guestId, statusGuest);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.statusGuest`,
        message: 'Cập nhật khách thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: error,
      });
    }
  }

  async bulkCreateGuests(eventId: string, guests: any[]) {
    try {
      if (typeof eventId !== 'string' || !ObjectId.isValid(eventId)) {
        throw new AppError({
          id: `${where}.bulkCreateGuests.invalidEventId`,
          message: 'Invalid eventId, must be a valid ObjectId string',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const eventIdObj = new ObjectId(eventId);

      const createdGuests: IGuest[] = [];
      const failedGuests: any[] = [];
      const totalAttempted = guests.length;

      for (const guestData of guests) {
        const guestPayload: Partial<IGuest> = {
          ...guestData,
          eventId: eventIdObj,
          createBy: EActionBy.Admin,
        };

        try {
          const result = await this.create(guestPayload as any);
          createdGuests.push(result as IGuest);
        } catch (error: any) {
          const errorMessage =
            error instanceof AppError
              ? error.message
              : error?.message || 'Lỗi không xác định khi tạo guest.';

          failedGuests.push({
            ...guestData,
            error: errorMessage,
          });
          // eslint-disable-next-line no-console
          console.error(
            `❌ [BULK CREATE - Sequential] Failed for ${guestData.name}:`,
            errorMessage,
          );
        }
      }

      if (failedGuests.length > 0) {
        throw new AppError({
          id: `${where}.bulkCreateGuests.partialFailure`,
          message: `Tạo thành công ${createdGuests.length}/${totalAttempted} khách. Có ${failedGuests.length} lỗi.`,
          statusCode: StatusCodes.BAD_REQUEST,
          detail: failedGuests,
        });
      }

      return {
        successCount: createdGuests.length,
        totalAttempted,
        message: `Tạo thành công ${createdGuests.length} khách mời.`,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.bulkCreateGuests`,
        message: 'Lỗi không xác định khi tạo khách mời hàng loạt',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
  async getUniqueTypeGuests(eventId: string): Promise<string[]> {
    if (!ObjectId.isValid(eventId)) {
      throw new AppError({
        id: `${where}.typeGuest`,
        message: 'ID sự kiện không hợp lệ.',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    return this.getStore().guest().getUniqueTypeGuests(eventId);
  }
}
