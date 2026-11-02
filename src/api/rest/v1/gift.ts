import { API } from 'api';
import * as handlers from 'api/handlers/gift';
import { authentication, authorization } from 'api/middleware';
import { EPermissions } from 'interface';

export function initGift(api: API) {
  api.baseRoutes.gifts.get('/web_user', api.handler(handlers.getAll));
  api.baseRoutes.gifts.get(
    '/list',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.gifts.get(
    '/gift',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.gifts.post(
    '/',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.createGift),
  );
  api.baseRoutes.gifts.put(
    '/order',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.swapOrder),
  );
  api.baseRoutes.gifts.get('/:giftId/web_user', api.handler(handlers.getDetail));
  api.baseRoutes.gifts.get(
    '/:giftId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.gifts.put(
    '/:giftId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.updateGift),
  );
  api.baseRoutes.gifts.delete(
    '/:giftId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.deleteGift),
  );
}
