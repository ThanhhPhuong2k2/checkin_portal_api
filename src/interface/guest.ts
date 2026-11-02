import { ObjectId } from 'mongodb';
import { EActionBy, ESortOrder } from './enum';

export interface IGuest {
  _id?: ObjectId;
  eventId: ObjectId;
  phoneNumber: string;
  name: string;
  typeGuest?: string;
  roleGuest?: string;
  nameCompany?: string;
  email?: string;
  statusGuest?: boolean;
  qrToken?: string;
  imageQrUrl?: string;
  createBy?: EActionBy;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface IGuestFilter {
  id?: ObjectId | string;
  start?: string;
  end?: string;
  keyword?: string;
  ids?: string[];
  events?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  typeGuests?: string[];
  roleGuest?: string;
  order?: ESortOrder;
  statusGuest?: boolean;

  createBy?: EActionBy[];
}
