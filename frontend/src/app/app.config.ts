import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAppRouting } from './app.routes';

/**
 * Zoneless by default in Angular 22 (no zone.js, D2). `HttpClient` has no interceptors: requests
 * carry no `Authorization` and no credentials (REQ-01.35, D4).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    ...provideAppRouting(),
    provideHttpClient(withFetch()),
  ],
};
