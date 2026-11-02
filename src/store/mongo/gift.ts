import { escapeRegExp, isNumber } from 'lodash';
import { ClientSession, Db, ObjectId } from 'mongodb';

import { ESortOrder, IGift, IGiftFilter } from 'interface';
import { Gift } from 'model';
import { BaseStore } from './base';

export class MongoGift extends BaseStore<IGift> {
  constructor(db: Db) {
    super(db, 'gift');
  }

  private getQuery(filters: IGiftFilter) {
    const condition: Record<string, any> = { deletedAt: null };
    const sort: Record<string, -1 | 1> = {};

    const paginate = {
      limit: 0,
      skip: 0,
      page: 0,
      hasPaginate: false,
    };

    if (filters.keyword) {
      const regex = new RegExp(escapeRegExp(filters.keyword), 'i');
      condition.$or = [{ name: { $regex: regex } }];
    }

    if (Array.isArray(filters.ids) && filters.ids.length) {
      condition._id = {
        $in: filters.ids.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)),
      };
    }

    if (Array.isArray(filters.events) && filters.events.length) {
      condition.eventId = {
        $in: filters.events.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)),
      };
    }

    if (filters.sort && filters.order) {
      sort[filters.sort] = filters.order === ESortOrder.Asc ? 1 : -1;
    } else {
      sort.order = 1;
    }

    if (isNumber(filters.page) && isNumber(filters.limit)) {
      paginate.skip = (filters.page - 1) * filters.limit;
      paginate.limit = filters.limit;
      paginate.page = filters.page;
      paginate.hasPaginate = true;
    }

    return { condition, sort, paginate };
  }

  async getPaginate(filters: IGiftFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const result = await this.collection
      .aggregate<{ data: IGift[]; pageInfo: Array<{ count: number }> }>([
        {
          $match: condition,
        },
        {
          $sort: sort,
        },
        {
          $facet: {
            data: [{ $skip: paginate.limit * (paginate.page - 1) }, { $limit: paginate.limit }],
            pageInfo: [{ $count: 'count' }],
          },
        },
      ])
      .next();

    const data = result?.data ?? [];
    const totalData = result?.pageInfo[0]?.count ?? 0;

    return {
      data,
      totalData,
      pagination: {
        limit: paginate.limit,
        page: paginate.page,
        totalPages: Math.ceil(totalData / paginate.limit),
        totalItems: totalData,
      },
    };
  }

  async getList(filters: IGiftFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.find<IGift>(condition).sort({ order: 1 }).toArray();
  }

  async getOne(filters: IGiftFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<IGift>(condition);
  }

  async createOne(data: Gift, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: Gift, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }

  async swapOrder(current: { id: string; order: number }, next: { id: string; order: number }) {
    if (Math.abs(current.order - next.order) === 1) {
      return Promise.all([
        this.collection.updateOne(
          {
            _id: new ObjectId(current.id),
          },
          {
            $set: { order: next.order },
          },
        ),
        this.collection.updateOne(
          {
            _id: new ObjectId(next.id),
          },
          {
            $set: {
              order: current.order,
            },
          },
        ),
      ]);
    }

    if (current.order < next.order) {
      return Promise.all([
        this.collection.updateOne(
          {
            _id: new ObjectId(current.id),
          },
          {
            $set: { order: next.order },
          },
        ),
        this.collection.updateMany(
          {
            order: { $gt: current.order, $lte: next.order },
            _id: { $ne: new ObjectId(current.id) },
          },
          {
            $inc: { order: -1 },
          },
        ),
      ]);
    }

    return Promise.all([
      this.collection.updateOne(
        {
          _id: new ObjectId(current.id),
        },
        {
          $set: { order: Number(next.order) },
        },
      ),
      this.collection.updateMany(
        {
          order: { $gte: Number(next.order), $lt: Number(current.order) },
          _id: { $ne: new ObjectId(current.id) },
        },
        {
          $inc: { order: 1 },
        },
      ),
    ]);
  }
}
