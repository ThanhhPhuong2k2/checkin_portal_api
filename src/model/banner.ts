import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IBanner } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.banner';

export class Banner implements IBanner {
  _id?: ObjectId;
  eventId: ObjectId;
  imageUrl: string;
  title: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IBanner) {
    this._id = data._id;
    this.eventId = data.eventId;
    this.imageUrl = data.imageUrl;
    this.title = data.title;
    this.order = data.order;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      eventId: yup.string().objectId().required('Vui lòng chọn sự kiện'),
      imageUrl: yup.string().trim().required('Vui lòng tải ảnh banner'),
      title: yup.string().default(''),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Banner({
      ...result,
      eventId: new ObjectId(result.eventId),
    });
  }

  preSave() {
    if (!this._id) delete this._id;
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = this.createdAt;
  }

  preUpdate() {
    delete this._id;
    delete this.createdAt;
    delete this.order;
    this.updatedAt = new Date();
  }
}
