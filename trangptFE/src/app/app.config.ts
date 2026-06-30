import { registerLocaleData } from '@angular/common';
import vi from '@angular/common/locales/vi';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  ArrowDownOutline,
  ArrowUpOutline,
  CloseCircleOutline,
  DoubleLeftOutline,
  DoubleRightOutline,
  FilterOutline,
  LeftOutline,
  LoadingOutline,
  ReloadOutline,
  RightOutline,
  SearchOutline,
  SettingOutline,
  SortAscendingOutline
} from '@ant-design/icons-angular/icons';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { provideNzI18n, vi_VN } from 'ng-zorro-antd/i18n';

import { routes } from './app.routes';

registerLocaleData(vi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideNzI18n(vi_VN),
    provideNzIcons([
      SearchOutline,
      CloseCircleOutline,
      FilterOutline,
      SortAscendingOutline,
      SettingOutline,
      LoadingOutline,
      DoubleLeftOutline,
      LeftOutline,
      RightOutline,
      DoubleRightOutline,
      ReloadOutline,
      ArrowUpOutline,
      ArrowDownOutline
    ]),
    provideHttpClient()
  ]
};


