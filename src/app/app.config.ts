import { BrowserAnimationsModule, provideAnimations } from "@angular/platform-browser/animations";
import { TuiRootModule } from "@taiga-ui/core";
import {ApplicationConfig, DEFAULT_CURRENCY_CODE, importProvidersFrom, LOCALE_ID, isDevMode} from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {TuiRoutableDialogModule} from "@taiga-ui/kit";
import { of } from 'rxjs';
import {TUI_LANGUAGE, TUI_ITALIAN_LANGUAGE} from '@taiga-ui/i18n';
import {DatePipe, registerLocaleData} from '@angular/common';
import localeIT from '@angular/common/locales/it';
import localeEN from '@angular/common/locales/en';
import {addLanguageHeaderInterceptor} from "@core/interceptors/add-language-header.interceptor";
import {SessionService} from "@core/services/admin-session.service";
import {jwtInterceptor} from "@core/interceptors/jwt.interceptor";
import { provideServiceWorker } from '@angular/service-worker';
import { catchRequireRootInterceptor } from "@core/interceptors/catch-require-root.interceptor";

registerLocaleData(localeIT);
registerLocaleData(localeEN);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
      })
      // withHashLocation()
    ),
    importProvidersFrom(TuiRootModule),
    DatePipe,
    provideHttpClient(withInterceptors([addLanguageHeaderInterceptor, jwtInterceptor, catchRequireRootInterceptor])),
    provideAnimations(),
    provideAnimationsAsync(),
    importProvidersFrom(TuiRoutableDialogModule),
    // if you build with `ng build --localize`, these tokens will be added for each locale.
    // { provide: TUI_LANGUAGE, useValue: of(TUI_ITALIAN_LANGUAGE) },
    // { provide: LOCALE_ID, useValue: 'it' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
]
};
