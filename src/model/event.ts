import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IEvent } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.event';

export class Events implements IEvent {
  _id?: ObjectId;
  name: string;
  description?: string;
  logo?: string | string[];
  CTATitle: string;
  registerButton: string;
  isOngoing: boolean;
  giftIds: string[];
  guestIds?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  imageUrl?: string;

  constructor(data: IEvent) {
    this._id = data._id;
    this.name = data.name;
    this.logo = data.logo;
    this.CTATitle = data.CTATitle;
    this.registerButton = data.registerButton;
    this.isOngoing = data.isOngoing;
    this.giftIds = data.giftIds ?? [];
    this.guestIds = data.guestIds;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt ?? null;
    this.imageUrl = data.imageUrl;
  }

  preSave() {
    const now = new Date();
    if (!this.createdAt) this.createdAt = now;
    this.updatedAt = now;
    if (this.deletedAt === undefined) this.deletedAt = null;
  }

  preUpdate() {
    this.updatedAt = new Date();
  }
}
