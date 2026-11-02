import to from 'await-to-js';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import { ObjectId } from 'mongodb';
import { AnyObject, date, object, ObjectSchema, ref, number } from 'yup';

import { AppError } from 'model';
import { formatErrorYup } from './function';

export function invalidInformation(id: string, message: string, errors?: any) {
  return new AppError({
    id,
    message,
    statusCode: StatusCodes.BAD_REQUEST,
    errors,
  });
}

export const validateEmail = (email: string) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

export const validatePhone = (phone: string) => {
  const regex = /^\d{10}$/;
  return regex.test(phone);
};

export const isFloatNumberString = (str: string) => {
  const floatRegex = /[-+]?[0-9]+\.[0-9]+$/;
  if (_.isString(str) && str.match(floatRegex)) {
    return true;
  }
  return false;
};

export const isStringEnum = (objectEnum: any, value: string) => {
  if (!Object.values(objectEnum).includes(value)) {
    return false;
  }

  return true;
};

export function isValidId(id: string | undefined): boolean {
  if (!id) return false;

  if (!ObjectId.isValid(id)) return false;

  return true;
}

export function isValidIds(ids: string[]): boolean {
  if (!ids.length || !Array.isArray(ids)) return false;

  for (const id of ids) {
    if (!ObjectId.isValid(id)) return false;
  }

  return true;
}

export const validateWithYup = async <T extends AnyObject>(schema: ObjectSchema<T>, data: any) => {
  try {
    return await schema.validate(data, { stripUnknown: true, abortEarly: false });
  } catch (errorYup: any) {
    throw formatErrorYup(errorYup);
  }
};

export async function validatePagination(page: any, limit: any) {
  const schema = object().shape({
    page: number()
      .integer('page phải là một số nguyên')
      .positive('page phải là một số dương')
      .required('page là bắt buộc')
      .typeError('page phải là kiểu dữ liệu số'),
    limit: number()
      .integer('limit phải là một số nguyên')
      .positive('limit phải là một số dương')
      .required('limit là bắt buộc')
      .typeError('limit phải là kiểu dữ liệu số'),
  });

  const [errors, result] = await to(validateWithYup(schema, { page, limit }));

  if (errors || !result) {
    throw invalidInformation(`pagination.validate`, 'Dữ liệu phân trang không hợp lệ', errors);
  }
}

export async function validateExportTime(start: any, end: any) {
  const schema = object().shape({
    start: date().required('Start date is required').typeError('Start date must be a valid date'),
    end: date()
      .required('End date is required')
      .typeError('End date must be a valid date')
      .min(ref('start'), 'End date must be later than start date'),
  });

  const [errors, result] = await to(validateWithYup(schema, { start, end }));

  if (errors || !result) {
    throw invalidInformation(`export.validate`, 'Thời gian không hợp lệ', errors);
  }
}
