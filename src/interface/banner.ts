import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IBanner {
  _id?: ObjectId;
  eventId: ObjectId;
  imageUrl: string;
  title: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBannerFilter {
  keyword?: string;
  ids?: string[];
  events?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
