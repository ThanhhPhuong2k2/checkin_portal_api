import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { generateRandomNumber } from 'utils';

const localStorage = multer.diskStorage({
  destination(req, file, cb) {
    const fileFolder = './public/files';
    fs.mkdirSync(fileFolder, { recursive: true });
    cb(null, fileFolder);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${generateRandomNumber()}-${file.originalname}`);
  },
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 30 * 1024 * 1024;

export const multerUploadVideo = multer({
  storage: localStorage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter(req, file, callback) {
    const ext = path.extname(file.originalname);

    if (ext !== '.mp4' && ext !== '.mov' && ext !== '.avi' && ext !== '.mkv' && ext !== '.webm') {
      return callback(new Error('Only .mp4/.mov/.avi/.mkv/.webm are allowed'));
    }

    callback(null, true);
  },
});

export const multerUploadImage = multer({
  storage: localStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(req, file, callback) {
    const ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.webp' && ext !== '.jpeg') {
      return callback(new Error('Only .png/.jpg/.jpeg/.webp are allowed'));
    }
    callback(null, true);
  },
});

export const multerUploadFile = multer({
  storage: localStorage,
  fileFilter(req, file, callback) {
    callback(null, true);
  },
});
