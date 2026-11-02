import { I18n } from 'i18n';
import path from 'path';

const i18n = new I18n({
  locales: ['en', 'vi'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'vi',
  updateFiles: false,
  objectNotation: true,
});

export default i18n;
