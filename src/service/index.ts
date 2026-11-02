import { IConfig } from 'interface';
import { MetaDAPService } from './metadap';
import { DirectusService } from './directus';

export class Services {
  MetaDAP: MetaDAPService;
  directus: DirectusService;

  constructor(config: IConfig) {
    this.MetaDAP = new MetaDAPService(config.httpSettings);
    this.directus = new DirectusService(config.directus);
  }
}
