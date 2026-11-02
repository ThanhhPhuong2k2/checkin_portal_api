// import to from 'await-to-js';
import { ObjectId } from 'mongodb';

import { EActionBy, IGuest } from 'interface';

// const where = 'model.guest';

export class Guest implements IGuest {
  _id?: ObjectId;
  eventId: ObjectId;
  phoneNumber: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  typeGuest?: string;
  roleGuest?: string;
  nameCompany?: string;
  email?: string;
  statusGuest?: boolean;
  qrToken?: string;
  imageQrUrl?: string;
  createBy?: EActionBy;

  constructor(data: IGuest) {
    this._id = data._id;
    this.eventId = data.eventId;
    this.phoneNumber = data.phoneNumber;
    this.typeGuest = data.typeGuest;
    this.roleGuest = data.roleGuest;
    this.nameCompany = data.nameCompany;
    this.email = data.email;
    this.statusGuest = data.statusGuest;
    this.qrToken = data.qrToken;
    this.imageQrUrl = data.imageQrUrl;
    this.createBy = data.createBy;
    this.name = data.name;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  preSave() {
    if (!this._id) delete this._id;
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = this.createdAt;
  }

  preUpdate() {
    delete this._id;
    delete this.createdAt;
    this.updatedAt = new Date();
  }
}
