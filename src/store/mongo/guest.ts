import { escapeRegExp, isNumber } from 'lodash';
import { ClientSession, Db, ObjectId } from 'mongodb';

import { ESortOrder, IGuest, IGuestFilter } from 'interface';
import { Events, Guest } from 'model';
import { BaseStore } from './base';

export class MongoGuest extends BaseStore<IGuest> {
  constructor(db: Db) {
    super(db, 'guest');
  }

  private getQuery(filters: IGuestFilter) {
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

    if (filters.start && filters.end) {
      condition.createdAt = {
        $gte: new Date(filters.start),
        $lte: new Date(filters.end),
      };
    }
    if (Array.isArray(filters.createBy) && filters.createBy.length) {
      condition.createBy = { $in: filters.createBy };
    }

    if (typeof filters.statusGuest === 'boolean') {
      condition.statusGuest = filters.statusGuest;
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
    if (Array.isArray(filters.typeGuests) && filters.typeGuests.length) {
      condition.typeGuest = { $in: filters.typeGuests };
    }

    if (filters.sort && filters.order) {
      sort[filters.sort] = filters.order === ESortOrder.Asc ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    if (isNumber(filters.page) && isNumber(filters.limit)) {
      paginate.skip = (filters.page - 1) * filters.limit;
      paginate.limit = filters.limit;
      paginate.page = filters.page;
      paginate.hasPaginate = true;
    }

    return { condition, sort, paginate };
  }
  async getEvent(id: ObjectId) {
    const result = await this.collection
      .aggregate([
        {
          $match: {
            _id: new ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event',
          },
        },
        { $unwind: '$event' },
      ])
      .next();
    return result;
  }

  async getPaginate(filters: IGuestFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const result = await this.collection
      .aggregate<{ data: IGuest[]; pageInfo: Array<{ count: number }> }>([
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

  async getList(filters: IGuestFilter) {
    const { condition, sort } = this.getQuery(filters);
    return this.collection.find<IGuest>(condition).sort(sort).toArray();
  }

  async getOne(filters: IGuestFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<IGuest>(condition);
  }
  async getUniqueTypeGuests(eventId: string) {
    const condition: Record<string, any> = {
      deletedAt: null,
      eventId: ObjectId.isValid(eventId) ? new ObjectId(eventId) : eventId,
      typeGuest: { $exists: true, $ne: null },
    };

    const uniqueTypes = await this.collection.distinct('typeGuest', condition);

    return uniqueTypes as string[];
  }

  async createOne(data: Guest, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: Events, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }
  async statusGuest(id: string, onGoing: boolean) {
    Promise.all([
      await this.collection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            statusGuest: onGoing,
          },
        },
      ),
    ]);
  }
}
