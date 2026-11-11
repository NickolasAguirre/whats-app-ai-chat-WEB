import { InjectionToken } from '@angular/core';

/** Base URL of the bot API. The layout container can override it when it mounts this module. */
export const BOT_API_URL = new InjectionToken<string>('BOT_API_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3200',
});
