export interface DirectusData {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  folder: string;
  uploaded_by: string;
  created_on: string;
  modified_by: any;
  modified_on: string;
  charset: any;
  filesize: string;
  width: number;
  height: number;
  duration: any;
  embed: any;
  description: any;
  location: any;
  tags: any;
  metadata: any;
  focal_point_x: any;
  focal_point_y: any;
  tus_id: any;
  tus_data: any;
  uploaded_on: string;
}

export interface FileUpload {
  width: number;
  height: number;
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  path: string;
  size: number;
  filename: string;
  uploadDate: Date;
}
