import { StatusCodes } from 'http-status-codes';
import { isEmpty } from 'lodash';

import { IErrors } from 'interface';
import i18n from 'shared/i18n';
import { ErrNotFound } from 'store/errors';

export class AppError {
  id: string;
  message: string;
  statusCode: number;
  detail?: any;
  errors?: IErrors;
  params?: Record<string, any>;

  constructor(data: {
    id: string;
    message: string;
    statusCode: number;
    detail?: any;
    errors?: IErrors;
    params?: Record<string, any>;
  }) {
    this.id = data.id;
    this.message = data.message;
    this.statusCode = data.statusCode;
    this.detail = data.detail;
    this.errors = data.errors;
    this.params = data.params;
  }

  private t = (key: string, locale: string) => {
    return i18n.__(
      {
        phrase: key,
        locale,
      },
      this.params || {},
    );
  };

  toNotFound(err: any, message?: string) {
    if (err instanceof ErrNotFound) {
      this.message = message || this.message;
      this.statusCode = StatusCodes.NOT_FOUND;
    } else {
      this.errors = err;
    }

    return this;
  }

  translate = (locale: string) => {
    this.message = this.t(this.message, locale);

    if (!isEmpty(this.errors)) {
      const errors: IErrors = {};

      Object.entries(this.errors).forEach(([key, messages]) => {
        errors[key] = messages.map((item) => ({
          id: item.id,
          message: this.t(item.message, locale),
        }));
      });

      this.errors = errors;
    }

    delete this.params;
  };
}
