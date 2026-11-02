import VError from 'verror';

export class ErrNotFound extends VError {
  resource: string;

  id: string;

  constructor(resource: string, id: string) {
    super();
    this.resource = resource;
    this.id = id;
    this.message = `Not Found resource: ${this.resource} id: ${this.id}`;
  }
}
