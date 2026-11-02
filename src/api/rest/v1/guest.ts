import { API } from 'api';
import * as handlers from 'api/handlers/guest';
import { authentication, authorization } from 'api/middleware';
import { EPermissions } from 'interface';

export function initGuest(api: API) {
  api.baseRoutes.guest.post(
    '/register',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.create),
  );
  api.baseRoutes.guest.post('/register-user', api.handler(handlers.createUser));
  api.baseRoutes.guest.put(
    '/:guestId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.updateAdmin),
  );
  api.baseRoutes.guest.put(
    '/:guestId/statusguest',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.statusGuest),
  );
  api.baseRoutes.guest.delete(
    '/:id',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.deleteAdmin),
  );

  api.baseRoutes.guest.post(
    '/export',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.exportGuest),
  );
  api.baseRoutes.guest.get(
    '/types/:eventId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getUniqueTypeGuests),
  );
  api.baseRoutes.guest.get(
    '/list',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.guest.get(
    '/',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.guest.get(
    '/:guestId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.guest.post('/checkin', api.handler(handlers.getGuestByQr));
  api.baseRoutes.guest.post(
    '/import',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.bulkCreateGuest),
  );
}
