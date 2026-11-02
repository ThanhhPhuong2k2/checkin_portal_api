import { ObjectId } from 'mongodb';
import { addMethod, string, StringSchema } from 'yup';

addMethod<StringSchema>(string, 'objectId', function () {
  return this.test('objectId', 'Id không đúng định dạng', (value) => {
    if (!value) return true; // Allow undefined or null
    return ObjectId.isValid(value);
  });
});

// Declare module to extend yup types
declare module 'yup' {
  interface StringSchema {
    objectId(): this;
  }
}
