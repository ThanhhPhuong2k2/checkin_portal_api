import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IGift {
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
}

export interface IGiftFilter {
  keyword?: string;
  ids?: string[];
  events?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
