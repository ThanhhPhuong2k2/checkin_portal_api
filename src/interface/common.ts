export interface ICondition {
  [index: string]: any;
}

export interface IWithPagination<T> {
  data: T[];
  totalData: number;
}

export interface IMultiLanguages {
  vi: string;
  en: string;
}
