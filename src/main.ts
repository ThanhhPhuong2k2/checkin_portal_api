import { config } from 'config';
import { logger } from 'logger';
import { Server } from 'server';

async function main() {
  const server = new Server(config);

  const shutdown = (reason?: any) => {
    logger.info('Server shutdown', { reason });
    server.stop();
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });

  try {
    await server.setup();
    await server.start();
  } catch (error) {
    shutdown(error);
  }
}

main();
