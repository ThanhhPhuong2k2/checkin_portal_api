import {
  createDirectus,
  deleteFile,
  deleteFiles,
  DirectusClient,
  importFile,
  rest,
  RestClient,
  staticToken,
  StaticTokenClient,
} from '@directus/sdk';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import FileType from 'file-type';

import { DirectusData, FileUpload, IDirectusSettings } from 'interface';
import { isValidFileExtension, removeFileLocal } from 'utils';

export class DirectusService {
  private config: IDirectusSettings;
  private client: DirectusClient<any> & StaticTokenClient<any> & RestClient<any>;
  constructor(config: IDirectusSettings) {
    this.config = config;
    this.client = createDirectus(config.directusHost)
      .with(staticToken(config.staticToken))
      .with(rest());
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const fileType = await FileType.fromStream(fs.createReadStream(file.path));

      if (!fileType) {
        throw new Error('File không hợp lệ');
      }

      const filename = isValidFileExtension(file.filename)
        ? file.filename
        : `${file.filename}.${fileType?.ext}`;

      const formData = new FormData();
      formData.append('folder', this.config.folderCode);
      formData.append('file', fs.createReadStream(file.path), {
        filename,
        contentType: file.mimetype,
      });

      const { data: result } = await axios.post<{
        data: DirectusData;
      }>(`${this.config.directusHost}/files`, formData, {
        headers: { ...formData.getHeaders(), Authorization: `Bearer ${this.config.staticToken}` },
      });

      return {
        width: result.data.width,
        height: result.data.height,
        fieldname: result.data.filename_disk,
        originalname: result.data.filename_download,
        encoding: file.encoding,
        mimetype: file.mimetype,
        path: `${this.config.directusHost}/assets/${result.data.id}/${result.data.filename_download}`,
        size: file.size,
        filename,
        uploadDate: new Date(),
      } as FileUpload;
    } finally {
      removeFileLocal(file.path);
    }
  }

  async patchFile(fileId: string, file: Express.Multer.File) {
    try {
      const fileType = await FileType.fromStream(fs.createReadStream(file.path));

      if (!fileType) {
        throw new Error('File không hợp lệ');
      }

      const filename = isValidFileExtension(file.filename)
        ? file.filename
        : `${file.filename}.${fileType?.ext}`;

      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.path), {
        filename,
        contentType: file.mimetype,
      });
      const { data: result } = await axios.patch<{
        data: DirectusData;
      }>(`${this.config.directusHost}/files/${fileId}`, formData, {
        headers: { ...formData.getHeaders(), Authorization: `Bearer ${this.config.staticToken}` },
      });

      return {
        width: result.data.width,
        height: result.data.height,
        fieldname: result.data.filename_disk,
        originalname: result.data.filename_download,
        encoding: file.encoding,
        mimetype: file.mimetype,
        path: `${this.config.directusHost}/assets/${result.data.id}/${result.data.filename_download}`,
        size: file.size,
        filename,
        uploadDate: new Date(),
      } as FileUpload;
    } finally {
      removeFileLocal(file.path);
    }
  }

  async importFile(fileUrl: string, folder?: string) {
    const result = await this.client.request<DirectusData>(
      importFile(fileUrl, {
        folder,
      }),
    );

    return {
      width: result.width,
      height: result.height,
      fieldname: result.filename_download,
      originalname: result.filename_disk,
      encoding: '',
      mimetype: result.type,
      path: `${this.config.directusHost}/assets/${result.id}/${result.filename_download}`,
      size: result.filesize,
      filename: result.filename_download,
    };
  }

  private getFileId(path: string) {
    const regex = /\/assets\/([a-f0-9-]+)\//;
    const match = path.match(regex);
    return match ? match[1] : null;
  }

  async deleteByPath(path: string) {
    const fileId = this.getFileId(path);

    if (fileId) {
      await this.client.request(deleteFile(fileId));
    }
  }

  async deleteByPaths(paths: string[]) {
    const fileIds: string[] = [];

    paths.forEach((path) => {
      const fileId = this.getFileId(path);
      if (fileId) fileIds.push(fileId);
    });

    await this.client.request(deleteFiles(fileIds));
  }
}
