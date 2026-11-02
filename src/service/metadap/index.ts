import { IHttpSettings } from 'interface/config';
import { IdentityService } from './identity';

export class MetaDAPService {
  private config: IHttpSettings;

  constructor(config: IHttpSettings) {
    this.config = config;
  }

  identity() {
    return new IdentityService(this.config);
  }
}
