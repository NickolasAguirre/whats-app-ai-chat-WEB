import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { ConversationsApi } from './core/domain/ports/conversations-api.port';
import { InstructionsApi } from './core/domain/ports/instructions-api.port';
import { WhatsAppNumbersApi } from './core/domain/ports/whatsapp-numbers-api.port';
import { MockConversationsApi } from './infrastructure/mock/mock-conversations-api';
import { MockInstructionsApi } from './infrastructure/mock/mock-instructions-api';
import { MockWhatsAppNumbersApi } from './infrastructure/mock/mock-whatsapp-numbers-api';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: InstructionsApi, useClass: MockInstructionsApi },
    { provide: WhatsAppNumbersApi, useClass: MockWhatsAppNumbersApi },
    { provide: ConversationsApi, useClass: MockConversationsApi },
  ],
};
