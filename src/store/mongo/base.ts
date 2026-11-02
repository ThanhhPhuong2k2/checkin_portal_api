import {
  Collection,
  Db,
  DeleteOptions,
  Document,
  Filter,
  FindOptions,
  MatchKeysAndValues,
  ObjectId,
  UpdateFilter,
  UpdateOptions,
} from 'mongodb';

export class BaseStore<T extends Document> {
  collection: Collection<T>;

  constructor(db: Db, collectionName: string) {
    this.collection = db.collection<T>(collectionName);
  }

  preSet(data: MatchKeysAndValues<T>) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { _id, ...doc } = data;
    return Object.fromEntries(
      Object.entries(doc).filter(([, value]) => value !== undefined),
    ) as MatchKeysAndValues<T>;
  }

  async countDocuments(filters: Filter<T> = {}) {
    return this.collection.countDocuments(filters);
  }

  async findById<Type extends object = T>(
    id: string | ObjectId,
    projection: Partial<Record<keyof Type, any>> = {},
    options: FindOptions<T> = {},
  ): Promise<Type | null> {
    return this.collection.findOne<Type>({ _id: new ObjectId(id) } as Filter<T>, {
      projection,
      ...options,
    });
  }

  async find<Type extends object = T>(
    filters: Filter<T> = {},
    projection: Partial<Record<keyof Type, any>> = {},
    options: FindOptions<T> = {},
  ): Promise<Type[]> {
    return this.collection.find<Type>(filters, { projection, ...options }).toArray();
  }

  async findOne<Type extends object = T>(
    filters: Filter<T>,
    projection: Partial<Record<keyof Type, any>> = {},
  ): Promise<Type | null> {
    return this.collection.findOne<Type>(filters, { projection });
  }

  async baseUpdate(
    filters: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions,
  ): Promise<void> {
    if (update.$set) {
      update.$set = this.preSet(update.$set);
    }
    await this.collection.updateOne(filters, update, options);
  }

  async baseUpdateMany(
    filters: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions,
  ): Promise<void> {
    if (update.$set) {
      update.$set = this.preSet(update.$set);
    }
    await this.collection.updateMany(filters, update, options);
  }

  async baseDelete(filters: Filter<T>, options?: DeleteOptions): Promise<void> {
    await this.collection.deleteOne(filters, options);
  }

  async baseDeleteMany(filters: Filter<T>, options?: DeleteOptions): Promise<void> {
    await this.collection.deleteMany(filters, options);
  }
}
