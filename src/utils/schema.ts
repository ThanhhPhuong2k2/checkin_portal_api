import * as yup from 'yup';
import './extension';

export const FileUploadSchema = yup.object({
  width: yup.number().default(0),
  height: yup.number().default(0),
  fieldname: yup.string().default(''),
  originalname: yup.string().default(''),
  encoding: yup.string().default(''),
  mimetype: yup.string().default(''),
  path: yup.string().required(),
  size: yup.number().default(0),
  filename: yup.string().default(''),
  uploadDate: yup
    .date()
    .transform((value) => new Date(value))
    .default(new Date()),
});
