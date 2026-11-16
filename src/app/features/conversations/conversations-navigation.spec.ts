import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from '../../app.routes';
import { CasesApi } from '../../core/domain/ports/cases-api.port';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { ConversationsPage } from './conversations-page';
import { ConversationThreadPage } from './conversation-thread-page';

const person = {
  id: 'p-1',
  phoneNumber: '+57 399 100 0001',
  name: 'María Gómez',
  lastMessageAt: new Date('2026-11-15T10:00:00Z'),
  lastMessagePreview: 'Hola, ¿a qué hora abren hoy?',
};

describe('Conversations navigation', () => {
  function setup() {
    // The real route table, without its route-level providers (those build the HTTP adapters).
    const testRoutes = routes.map((route) => ({ ...route, providers: undefined }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter(testRoutes, withComponentInputBinding()),
        {
          provide: ConversationsApi,
          useValue: {
            listPeople: vi.fn(() => of([person])),
            getPerson: vi.fn(() => of(person)),
            listMessages: vi.fn(() => of({ items: [], cursor: null, hasMore: false })),
          },
        },
        { provide: CasesApi, useValue: { create: vi.fn() } },
      ],
    });
  }

  it('opens the thread of a person when its row in the list is clicked', async () => {
    setup();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/whatsapp/conversations', ConversationsPage);
    harness.detectChanges();

    const link = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('ul a')!;
    expect(link.getAttribute('href')).toBe('/whatsapp/conversations/p-1');

    link.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/whatsapp/conversations/p-1');
    expect(harness.routeNativeElement!.textContent).toContain('María Gómez');
  });

  it('renders the thread component for that url', async () => {
    setup();
    const harness = await RouterTestingHarness.create();
    const thread = await harness.navigateByUrl('/whatsapp/conversations/p-1', ConversationThreadPage);

    expect(thread.personId()).toBe('p-1');
  });
});
