import { Server } from 'server';

export default class BaseApp {
  private server: Server;

  constructor(server: Server) {
    this.server = server;
  }

  getStore() {
    return this.server.getStore();
  }

  getConfig() {
    return this.server.getConfig();
  }

  getServices() {
    return this.server.services;
  }
}
