import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Person } from '../../core/domain/models/models';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { RecentConversations } from './recent-conversations';

function person(index: number): Person {
  return {
    id: `p${index}`,
    phoneNumber: `+57 300 000 00${index}`,
    name: index % 2 === 0 ? `Cliente ${index}` : undefined,
    lastMessageAt: new Date(),
    lastMessagePreview: `Mensaje ${index}`,
  };
}

describe('RecentConversations', () => {
  function setup(listPeople: () => ReturnType<ConversationsApi['listPeople']>) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ConversationsApi, useValue: { listPeople: vi.fn(listPeople) } }],
    });
    const fixture = TestBed.createComponent(RecentConversations);
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows the latest six conversations, each linking to its thread', async () => {
    const { fixture, element } = setup(() => of(Array.from({ length: 8 }, (_, index) => person(index))));
    await fixture.whenStable();

    const links = [...element.querySelectorAll<HTMLAnchorElement>('ul a')];
    expect(links).toHaveLength(6);
    expect(links[0].getAttribute('href')).toBe('/whatsapp/conversations/p0');
    expect(element.textContent).toContain('Cliente 0');
    expect(element.textContent).toContain('+57 300 000 001');
    expect(element.querySelector('a[href="/whatsapp/conversations"]')?.textContent).toContain('Ver todas');
  });

  it('explains the empty state', async () => {
    const { fixture, element } = setup(() => of([]));
    await fixture.whenStable();
    expect(element.textContent).toContain('Todavía no hay conversaciones');
  });

  it('offers a retry when loading fails', async () => {
    const { fixture, element } = setup(() => throwError(() => new Error('boom')));
    await fixture.whenStable();

    expect(element.querySelector('[role=alert]')?.textContent).toContain('No se pudieron cargar');
    expect([...element.querySelectorAll('button')].some((button) => button.textContent?.includes('Reintentar'))).toBe(true);
  });
});
