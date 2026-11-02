import { API } from 'api';
import * as handlers from 'api/handlers/upload';
import {
  authentication,
  authorization,
  multerUploadFile,
  multerUploadImage,
  multerUploadVideo,
} from 'api/middleware';
import { EPermissions } from 'interface';

export function initUpload(api: API) {
  api.baseRoutes.upload.post(
    '/image',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    multerUploadImage.single('image'),
    api.handler(handlers.uploadFile),
  );
  api.baseRoutes.upload.post(
    '/images',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    multerUploadImage.array('images', 5),
    api.handler(handlers.uploadFiles),
  );
  api.baseRoutes.upload.post(
    '/video',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    multerUploadVideo.single('video'),
    api.handler(handlers.uploadFile),
  );
  api.baseRoutes.upload.post(
    '/file',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    multerUploadFile.single('file'),
    api.handler(handlers.uploadFile),
  );
  api.baseRoutes.upload.post('/import', api.handler(handlers.importFile));
  api.baseRoutes.upload.patch(
    '/files/:fileId',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    multerUploadFile.single('file'),
    api.handler(handlers.patchFile),
  );
  api.baseRoutes.upload.post(
    '/remove_file',
    api.handler(authentication('admin')),
    api.handler(authorization([EPermissions.THIRD_PARTY_EVENT_MANAGER])),
    api.handler(handlers.removeFile),
  );
}
