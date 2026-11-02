import to from 'await-to-js';
import { ClientSession, Db, MongoClient } from 'mongodb';

import { IConfig, IMongoSettings } from 'interface';
import { logger } from 'logger';
import { delayFunction } from 'utils';
import { MongoBanner, MongoEvent, MongoGift, MongoGuest } from './mongo';

const DB_PING_ATTEMPTS = 5;
const DB_PING_TIMEOUT_SECS = 10;

class MongoStores {
  clientSession?: ClientSession;
  event?: MongoEvent;
  banner?: MongoBanner;
  guest?: MongoGuest;
  gift?: MongoGift;
}

export default class MongoStore {
  private static instance: MongoStore;
  client: MongoClient;
  config: IMongoSettings;
  stores: MongoStores;
  db?: Db;

  private constructor(mongoConfig: IMongoSettings) {
    this.config = mongoConfig;
    this.client = new MongoClient(`mongodb://${this.config.mongoUri}`, {
      auth: { username: this.config.mongoUsername, password: this.config.mongoPassword },
    });
    this.stores = new MongoStores();
  }

  static async getInstance(config: IConfig) {
    if (!this.instance) {
      this.instance = new MongoStore(config.mongoSettings);
      await this.instance.start();
    }

    return this.instance;
  }

  setup = async () => {
    for (let i = 0; i < DB_PING_ATTEMPTS; i += 1) {
      const [error] = await to(this.client.connect());

      if (!error) {
        logger.info('Connect MongoDB successfully!');
        this.db = this.client.db(this.config.mongoDatabase);
        break;
      }

      if (i === DB_PING_ATTEMPTS - 1) {
        throw error;
      }

      logger.error(`Connect MongoDB fail at time ${i + 1}: ${error?.message}`);
      await delayFunction(DB_PING_TIMEOUT_SECS * 1000);
    }
  };

  start = async () => {
    await this.setup();

    if (this.db) {
      this.stores.guest = new MongoGuest(this.db);
      this.stores.banner = new MongoBanner(this.db);
      this.stores.gift = new MongoGift(this.db);
      this.stores.event = new MongoEvent(this.db);
    }
  };

  close = async () => {
    if (this.client) {
      await this.client.close();
    }
  };

  startSession = () => {
    const session = this.client.startSession();
    session.startTransaction();

    return session;
  };

  endSession = async (session: ClientSession) => {
    await session.commitTransaction();
    session.endSession();
  };

  abortSession = async (session?: ClientSession) => {
    if (!session) return;

    await session.abortTransaction();
    session.endSession();
  };

  dropDatabase = async () => {
    await this.db?.dropDatabase();
  };

  database = () => this.db;

  event() {
    if (!this.stores.event) {
      throw new Error('Event Store is not setup yet');
    }
    return this.stores.event;
  }

  banner() {
    if (!this.stores.banner) {
      throw new Error('Banner Store is not setup yet');
    }
    return this.stores.banner;
  }

  gift() {
    if (!this.stores.gift) {
      throw new Error('Gift Store is not setup yet');
    }
    return this.stores.gift;
  }

  guest() {
    if (!this.stores.guest) {
      throw new Error('Guest Store is not setup yet');
    }
    return this.stores.guest;
  }
}
