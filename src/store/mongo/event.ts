import { escapeRegExp, isNumber } from 'lodash';
import { ClientSession, Db, ObjectId } from 'mongodb';

import { ESortOrder, IEvent, IEventFilter } from 'interface';
import { Events } from 'model';
import { BaseStore } from './base';

export class MongoEvent extends BaseStore<IEvent> {
  constructor(db: Db) {
    super(db, 'events');
  }

  private getQuery(filters: IEventFilter) {
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

    if (typeof filters.isOngoing === 'boolean') {
      condition.isOngoing = filters.isOngoing;
    }

    if (Array.isArray(filters.ids) && filters.ids.length) {
      condition._id = {
        $in: filters.ids.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)),
      };
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

  async getPaginate(filters: IEventFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const pipeline: any[] = [
      { $match: condition },

      {
        $lookup: {
          from: 'guest',
          localField: '_id',
          foreignField: 'eventId',
          as: 'guests_data',
        },
      },

      {
        $addFields: {
          totalGuests: { $size: '$guests_data' },
          checkedIn: {
            $size: {
              $filter: {
                input: '$guests_data',
                as: 'g',
                cond: { $eq: ['$$g.statusGuest', true] },
              },
            },
          },
        },
      },

      { $project: { guests_data: 0 } },

      { $sort: sort },
      {
        $facet: {
          data: [{ $skip: paginate.limit * (paginate.page - 1) }, { $limit: paginate.limit }],
          pageInfo: [{ $count: 'count' }],
        },
      },
    ];

    const result = await this.collection
      .aggregate<{ data: IEvent[]; pageInfo: Array<{ count: number }> }>(pipeline)
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

  async getList(filters: IEventFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection
      .aggregate([
        { $match: condition },

        {
          $lookup: {
            from: 'banners',
            localField: '_id',
            foreignField: 'eventId',
            as: 'banners',
          },
        },

        {
          $lookup: {
            from: 'guest',
            localField: '_id',
            foreignField: 'eventId',
            as: 'guests_data',
          },
        },

        {
          $addFields: {
            totalGuests: { $size: '$guests_data' },
            checkedIn: {
              $size: {
                $filter: {
                  input: '$guests_data',
                  as: 'g',
                  cond: { $eq: ['$$g.statusGuest', true] },
                },
              },
            },
          },
        },
        {
          $unwind: {
            path: '$banners',
            preserveNullAndEmptyArrays: true,
          },
        },
        { $sort: { 'banners.order': 1 } },
        {
          $group: {
            _id: '$_id',
            logo: { $first: '$logo' },
            name: { $first: '$name' },
            CTATitle: { $first: '$CTATitle' },
            registerButton: { $first: '$registerButton' },
            isOngoing: { $first: '$isOngoing' },
            imageUrl: { $first: '$banners.imageUrl' },
            deletedAt: { $first: '$deletedAt' },
            createdAt: { $first: '$createdAt' },
            updatedAt: { $first: '$updatedAt' },

            totalGuests: { $first: '$totalGuests' },
            checkedIn: { $first: '$checkedIn' },
          },
        },
        { $sort: { isOngoing: -1, createdAt: -1 } },
      ])
      .toArray();
  }

  async getGifts(id: ObjectId) {
    const result = await this.collection
      .aggregate(
        [
          {
            $match: {
              _id: new ObjectId(id),
            },
          },
          {
            $addFields: {
              giftIdsObject: {
                $map: {
                  input: '$giftIds',
                  as: 'id',
                  in: { $toObjectId: '$$id' },
                },
              },
            },
          },
          {
            $lookup: {
              from: 'gift',
              localField: 'giftIdsObject',
              foreignField: '_id',
              as: 'gifts',
            },
          },
          { $unset: ['giftIdsObject'] },
        ],
        { maxTimeMS: 60000, allowDiskUse: true },
      )
      .next();
    return result;
  }

  async getOne(filters: IEventFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<IEvent>(condition);
  }

  async createOne(data: Events, session?: ClientSession) {
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

  async updateGoing(id: string, onGoing: boolean) {
    Promise.all([
      await this.collection.updateMany(
        {},
        {
          $set: {
            isOngoing: false,
          },
        },
      ),
      await this.collection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            isOngoing: onGoing,
          },
        },
      ),
    ]);
  }
}
