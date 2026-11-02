import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IGift } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.gift';

export class Gift implements IGift {
  _id?: ObjectId;
  name: string;
  imageUrl: string;
  content: string;
  url: string;
  documentUrl: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  constructor(data: IGift) {
    this._id = data._id;
    this.name = data.name;
    this.imageUrl = data.imageUrl;
    this.content = data.content;
    this.url = data.url;
    this.documentUrl = data.documentUrl;
    this.order = data.order;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      name: yup.string().trim().required('Vui lòng nhập tên quà tặng'),
      imageUrl: yup.string().trim().required('Vui lòng tải ảnh quả tặng'),
      content: yup.string().trim().required('Vui lòng nhập nội dung quà tặng'),
      url: yup.string().trim().required('Vui lòng nhập đường dẫn quà tặng'),
      documentUrl: yup.string().trim().required('Vui lòng nhập đường dẫn hướng dẫn'),
      order: yup.number(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Gift({
      ...result,
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
