import { API } from 'api';
import * as handlers from 'api/handlers/event';
import { authentication, authorization } from 'api/middleware';
import { EPermissions } from 'interface';

export function initEvent(api: API) {
  api.baseRoutes.events.get('/web_user', api.handler(handlers.getAll));
  api.baseRoutes.events.get('/active/web_user', api.handler(handlers.getEventActive));
  api.baseRoutes.events.get(
    '/list',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.events.get(
    '/',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.events.post(
    '/',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.createEvent),
  );
  api.baseRoutes.events.get('/:eventId/web_user', api.handler(handlers.getDetail));
  api.baseRoutes.events.get(
    '/:eventId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.events.put(
    '/:eventId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.updateEvent),
  );
  api.baseRoutes.events.delete(
    '/:eventId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.deleteEvent),
  );
  api.baseRoutes.events.put(
    '/:eventId/ongoing',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.updateOngoing),
  );
}
