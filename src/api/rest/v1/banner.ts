import { API } from 'api';
import * as handlers from 'api/handlers/banner';
import { authentication, authorization } from 'api/middleware';
import { EPermissions } from 'interface';

export function initBanner(api: API) {
  api.baseRoutes.banners.get('/web_user', api.handler(handlers.getAll));
  api.baseRoutes.banners.get(
    '/',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.banners.post(
    '/',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.createBanner),
  );
  api.baseRoutes.banners.put(
    '/order',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.swapOrderBanner),
  );
  api.baseRoutes.banners.get('/:bannerId/web_user', api.handler(handlers.getDetail));
  api.baseRoutes.banners.get(
    '/:bannerId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.banners.put(
    '/:bannerId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.updateBanner),
  );
  api.baseRoutes.banners.delete(
    '/:bannerId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.deleteBanner),
  );
}
