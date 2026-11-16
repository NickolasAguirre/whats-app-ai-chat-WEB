import { Routes } from '@angular/router';
import { ConversationsApi } from './core/domain/ports/conversations-api.port';
import { InstructionsApi } from './core/domain/ports/instructions-api.port';
import { KnowledgeApi } from './core/domain/ports/knowledge-api.port';
import { StatsApi } from './core/domain/ports/stats-api.port';
import { WhatsAppNumbersApi } from './core/domain/ports/whatsapp-numbers-api.port';
import { MockConversationsApi } from './infrastructure/mock/mock-conversations-api';
import { HttpInstructionsApi } from './infrastructure/http/http-instructions-api';
import { HttpKnowledgeApi } from './infrastructure/http/http-knowledge-api';
import { MockStatsApi } from './infrastructure/mock/mock-stats-api';
import { MockWhatsAppNumbersApi } from './infrastructure/mock/mock-whatsapp-numbers-api';

/**
 * Business screens of the bot panel. This file is what the module exposes to the layout container
 * (`./Routes` in federation.config.mjs), which mounts it inside its shell. It owns its data providers, so it
 * works wherever it is mounted. Layout, login, session and theme belong to the container.
 */
export const routes: Routes = [
  { path: 'whatsapp', pathMatch: 'full', redirectTo: 'whatsapp/dashboard' },
  {
    path: 'whatsapp',
    providers: [
      { provide: InstructionsApi, useClass: HttpInstructionsApi },
      { provide: WhatsAppNumbersApi, useClass: MockWhatsAppNumbersApi },
      { provide: ConversationsApi, useClass: MockConversationsApi },
      { provide: KnowledgeApi, useClass: HttpKnowledgeApi },
      { provide: StatsApi, useClass: MockStatsApi },
    ],
    children: [
      {
        path: 'dashboard',
        title: 'Resumen',
        loadComponent: () => import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'instructions',
        title: 'Instrucciones',
        loadComponent: () => import('./features/instructions/instructions-page').then((m) => m.InstructionsPage),
      },
      {
        path: 'numbers',
        title: 'Números',
        loadComponent: () => import('./features/numbers/numbers-page').then((m) => m.NumbersPage),
      },
      {
        path: 'numbers/:id',
        title: 'Detalle del número',
        loadComponent: () => import('./features/numbers/number-detail-page').then((m) => m.NumberDetailPage),
      },
      {
        path: 'conversations',
        title: 'Conversaciones',
        loadComponent: () =>
          import('./features/conversations/conversations-page').then((m) => m.ConversationsPage),
      },
      {
        path: 'conversations/:personId',
        title: 'Conversación',
        loadComponent: () =>
          import('./features/conversations/conversation-thread-page').then((m) => m.ConversationThreadPage),
      },
    ],
  },
];
