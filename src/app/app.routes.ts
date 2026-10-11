import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'instructions' },
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
      {
        path: '**',
        title: 'No encontrado',
        loadComponent: () => import('./features/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
