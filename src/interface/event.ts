import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IEvent {
  _id?: ObjectId;
  name: string;
  logo?: string | string[];
  CTATitle: string;
  registerButton: string;
  isOngoing: boolean;
  giftIds?: string[];
  guestIds?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  totalGuests?: number;
  checkedIn?: number;
  imageUrl?: string;
}

export interface IEventFilter {
  keyword?: string;
  ids?: string[];
  isOngoing?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
