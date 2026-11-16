import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { ConversationMessage, MessagesPage, MessagesQuery } from '../../core/domain/models/models';
import { CasesApi } from '../../core/domain/ports/cases-api.port';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { startOfToday } from '../../shared/date-range';
import { ConversationThreadPage } from './conversation-thread-page';

function message(id: string, minutesAgo: number): ConversationMessage {
  return {
    id,
    personId: 'p1',
    role: 'user',
    text: `Texto ${id}`,
    timestamp: new Date(Date.now() - minutesAgo * 60_000),
  };
}

function page(items: ConversationMessage[], hasMore: boolean): MessagesPage {
  return { items, cursor: items.length ? `cursor-${items[0].id}` : null, hasMore };
}


describe('ConversationThreadPage', () => {
  function setup(listMessages: (personId: string, query?: MessagesQuery) => Observable<MessagesPage>) {
    const api = {
      getPerson: vi.fn(() => of({ id: 'p1', phoneNumber: '+57 300 000 0001', lastMessageAt: new Date(), lastMessagePreview: '' })),
      listMessages: vi.fn(listMessages),
    };
    const cases = { create: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ConversationsApi, useValue: api }, { provide: CasesApi, useValue: cases }],
    });
    const fixture = TestBed.createComponent(ConversationThreadPage);
    fixture.componentRef.setInput('personId', 'p1');
    const element = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      [...element.querySelectorAll('button')].find((candidate) => candidate.textContent?.includes(label));
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { api, cases, fixture, element, button, settle };
  }

  it("loads only today's messages first", async () => {
    const { api, element, settle } = setup(() => of(page([message('a', 20), message('b', 10)], false)));
    await settle();

    expect(api.listMessages).toHaveBeenCalledTimes(1);
    expect(api.listMessages).toHaveBeenCalledWith('p1', { from: startOfToday(), limit: 100 });
    expect(element.textContent).toContain('Texto a');
    expect(element.textContent).toContain('Texto b');
    expect(element.textContent).toContain('Mostrando los mensajes de hoy');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/whatsapp/conversations');
  });

  it('shows an empty-today state and still offers earlier messages', async () => {
    const { element, button, settle } = setup(() => of(page([], false)));
    await settle();

    expect(element.textContent).toContain('No hay mensajes de hoy');
    expect(button('Cargar mensajes anteriores')).toBeDefined();
  });

  it('loads earlier days with the cursor, prepends them and hides the button when history ends', async () => {
    const earlier = [message('old1', 2000), message('old2', 1990)];
    const { api, element, button, settle } = setup((_, query) =>
      query?.before ? of(page(earlier, false)) : of(page([message('today', 5)], false)),
    );
    await settle();

    button('Cargar mensajes anteriores')!.click();
    await settle();

    expect(api.listMessages).toHaveBeenLastCalledWith('p1', { from: undefined, to: undefined, before: 'cursor-today', limit: 30 });
    const texts = [...element.querySelectorAll('ol li')].map((item) => item.textContent ?? '');
    expect(texts[0]).toContain('Texto old1');
    expect(texts.at(-1)).toContain('Texto today');
    expect(button('Cargar mensajes anteriores')).toBeUndefined();
  });

  it('keeps the same day bound while today still has more messages', async () => {
    const { api, button, settle } = setup((_, query) =>
      query?.before ? of(page([message('a', 40)], false)) : of(page([message('b', 5)], true)),
    );
    await settle();

    button('Cargar mensajes anteriores')!.click();
    await settle();

    expect(api.listMessages).toHaveBeenLastCalledWith('p1', { from: startOfToday(), to: undefined, before: 'cursor-b', limit: 30 });
    expect(button('Cargar mensajes anteriores')).toBeDefined();
  });

  it('keeps the loaded messages and offers another try when loading earlier fails', async () => {
    const { element, button, settle } = setup((_, query) =>
      query?.before ? throwError(() => new Error('boom')) : of(page([message('today', 5)], false)),
    );
    await settle();

    button('Cargar mensajes anteriores')!.click();
    await settle();

    expect(element.querySelector('[role=alert]')?.textContent).toContain('No se pudieron cargar los mensajes anteriores');
    expect(element.textContent).toContain('Texto today');
    expect(button('Cargar mensajes anteriores')).toBeDefined();
  });

  it('shows the error state with retry when the first load fails', async () => {
    const { element, button, settle } = setup(() => throwError(() => new Error('boom')));
    await settle();

    expect(element.querySelector('[role=alert]')?.textContent).toContain('No se pudieron cargar los mensajes');
    expect(button('Reintentar')).toBeDefined();
  });

  it('appends new messages from polling without repeating the ones already shown', async () => {
    vi.useFakeTimers();
    try {
      let calls = 0;
      const { element, settle } = setup(() => {
        calls += 1;
        return calls === 1
          ? of(page([message('a', 10)], false))
          : of(page([message('a', 10), message('new', 0)], false));
      });
      await settle();

      await vi.advanceTimersByTimeAsync(5000);
      await settle();

      const items = [...element.querySelectorAll('ol li')].map((item) => item.textContent ?? '');
      expect(items).toHaveLength(2);
      expect(items[1]).toContain('Texto new');
    } finally {
      vi.useRealTimers();
    }
  });

  it('drops an earlier page that arrives after another person was opened and unlocks the button', async () => {
    const late = new Subject<MessagesPage>();
    const { element, fixture, button, settle } = setup((_, query) =>
      query?.before ? late : of(page([message('today', 5)], false)),
    );
    await settle();

    button('Cargar mensajes anteriores')!.click();
    await settle();
    fixture.componentRef.setInput('personId', 'p2');
    await settle();
    late.next(page([message('stale', 4000)], false));
    late.complete();
    await settle();

    expect(element.textContent).not.toContain('Texto stale');
    expect(button('Cargando…')).toBeUndefined();
    expect(button('Cargar mensajes anteriores')).toBeDefined();
  });

  it('has no date filter: the date range belongs to the conversations list', async () => {
    const { element, settle } = setup(() => of(page([message('a', 5)], false)));
    await settle();

    expect(element.querySelector('input[type=date]')).toBeNull();
  });

  describe('Registrar caso', () => {
    function open(element: HTMLElement, text: string, fixture: { detectChanges: () => void }) {
      const input = element.querySelector<HTMLInputElement>('#case-summary')!;
      input.value = text;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      input.form!.dispatchEvent(new Event('submit'));
    }

    it('registers a case for this person and links to it', async () => {
      const { cases, element, fixture, button, settle } = setup(() => of(page([message('a', 5)], false)));
      cases.create.mockReturnValue(of({ id: 'case-9' }));
      await settle();

      button('Registrar caso')!.click();
      await settle();
      open(element, '  No pudo pagar  ', fixture);
      await settle();

      expect(cases.create).toHaveBeenCalledWith('p1', 'No pudo pagar');
      expect(element.querySelector('[role=status]')?.textContent).toContain('Caso registrado');
      expect(element.querySelector('a[href="/whatsapp/cases/case-9"]')).not.toBeNull();
      expect(button('Registrar caso')).toBeUndefined();
    });

    it('asks for a summary and does not call the bot with an empty one', async () => {
      const { cases, element, fixture, button, settle } = setup(() => of(page([], false)));
      await settle();

      button('Registrar caso')!.click();
      await settle();
      open(element, '   ', fixture);
      await settle();

      expect(cases.create).not.toHaveBeenCalled();
      expect(element.querySelector('[role=alert]')?.textContent).toContain('Describe qué debe resolver');
    });

    it('shows the error from the bot and keeps the form open', async () => {
      const { cases, element, fixture, button, settle } = setup(() => of(page([], false)));
      cases.create.mockReturnValue(throwError(() => new Error('Persona no encontrada.')));
      await settle();

      button('Registrar caso')!.click();
      await settle();
      open(element, 'Algo', fixture);
      await settle();

      expect(element.querySelector('[role=alert]')?.textContent).toContain('Persona no encontrada.');
      expect(element.querySelector('#case-summary')).not.toBeNull();
    });

    it('forgets the registered case and the open form when another person is opened', async () => {
      const { cases, element, fixture, button, settle } = setup(() => of(page([message('a', 5)], false)));
      cases.create.mockReturnValue(of({ id: 'case-9' }));
      await settle();

      button('Registrar caso')!.click();
      await settle();
      open(element, 'Primero', fixture);
      await settle();
      expect(element.querySelector('a[href="/whatsapp/cases/case-9"]')).not.toBeNull();

      fixture.componentRef.setInput('personId', 'p2');
      await settle();
      expect(element.querySelector('a[href="/whatsapp/cases/case-9"]')).toBeNull();
      expect(button('Registrar caso')).toBeDefined();

      button('Registrar caso')!.click();
      await settle();
      open(element, 'Segundo', fixture);
      await settle();
      expect(cases.create).toHaveBeenLastCalledWith('p2', 'Segundo');
    });

    it('ignores a late answer for the previous person', async () => {
      const late = new Subject<{ id: string }>();
      const { cases, element, fixture, button, settle } = setup(() => of(page([message('a', 5)], false)));
      cases.create.mockReturnValue(late);
      await settle();

      button('Registrar caso')!.click();
      await settle();
      open(element, 'Para la primera', fixture);
      fixture.componentRef.setInput('personId', 'p2');
      await settle();
      late.next({ id: 'case-late' });
      late.complete();
      await settle();

      expect(element.querySelector('a[href="/whatsapp/cases/case-late"]')).toBeNull();
      expect(button('Registrar caso')).toBeDefined();
    });

    it('cancel closes the form without saving', async () => {
      const { cases, element, button, settle } = setup(() => of(page([], false)));
      await settle();

      button('Registrar caso')!.click();
      await settle();
      button('Cancelar')!.click();
      await settle();

      expect(cases.create).not.toHaveBeenCalled();
      expect(element.querySelector('#case-summary')).toBeNull();
      expect(button('Registrar caso')).toBeDefined();
    });
  });
});
