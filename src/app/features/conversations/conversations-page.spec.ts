import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { DateRange, Person } from '../../core/domain/models/models';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { startOfToday } from '../../shared/date-range';
import { ConversationsPage } from './conversations-page';

function person(id: string, name?: string): Person {
  return {
    id,
    phoneNumber: `+57 399 100 ${id}`,
    name,
    lastMessageAt: new Date('2026-11-15T10:00:00Z'),
    lastMessagePreview: `Mensaje de ${id}`,
  };
}

describe('ConversationsPage', () => {
  function setup(listPeople: (search: string, range?: DateRange) => Observable<Person[]>) {
    const api = { listPeople: vi.fn(listPeople) };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ConversationsApi, useValue: api }] });
    const fixture = TestBed.createComponent(ConversationsPage);
    const element = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      [...element.querySelectorAll('button')].find((candidate) => candidate.textContent?.includes(label));
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const type = (selector: string, value: string) => {
      const target = element.querySelector<HTMLInputElement>(selector)!;
      target.value = value;
      target.dispatchEvent(new Event('input'));
    };
    const submitRange = (from: string, to: string) => {
      type('#from', from);
      type('#to', to);
      fixture.detectChanges();
      element.querySelector('form')!.dispatchEvent(new Event('submit'));
    };
    return { api, element, fixture, button, settle, type, submitRange };
  }

  it('opens on the conversations with messages today, each linking to its thread', async () => {
    const { api, element, settle } = setup(() => of([person('0001', 'María'), person('0002')]));
    await settle();

    expect(api.listPeople).toHaveBeenCalledWith('', { from: startOfToday() });
    const links = [...element.querySelectorAll<HTMLAnchorElement>('ul a')];
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/0001');
    expect(links[0].textContent).toContain('María');
    expect(links[1].textContent).toContain('+57 399 100 0002');
    expect(element.textContent).toContain('Mostrando las conversaciones con mensajes de hoy');
  });

  it('explains that nothing happened today and how to see other days', async () => {
    const { element, settle } = setup(() => of([]));
    await settle();

    expect(element.textContent).toContain('Hoy todavía no hay conversaciones');
    expect(element.textContent).toContain('Elige otras fechas');
  });

  it('applies a date range as from and the start of the day after "Hasta"', async () => {
    const { api, element, button, settle, submitRange } = setup(() => of([person('0001')]));
    await settle();

    submitRange('2026-11-10', '2026-11-12');
    await settle();

    expect(api.listPeople).toHaveBeenLastCalledWith('', { from: new Date(2026, 10, 10), to: new Date(2026, 10, 13) });
    expect(element.textContent).toContain('Mostrando las conversaciones con mensajes en el rango elegido');
    expect(button('Ver solo hoy')).toBeDefined();
  });

  it('accepts a range with only one end', async () => {
    const { api, settle, submitRange } = setup(() => of([]));
    await settle();

    submitRange('2026-11-10', '');
    await settle();

    expect(api.listPeople).toHaveBeenLastCalledWith('', { from: new Date(2026, 10, 10), to: undefined });
  });

  it('rejects a range whose start is after its end without calling the bot', async () => {
    const { api, element, settle, submitRange } = setup(() => of([]));
    await settle();
    api.listPeople.mockClear();

    submitRange('2026-11-12', '2026-11-10');
    await settle();

    expect(element.querySelector('[role=alert]')?.textContent).toContain('"Desde" debe ser anterior');
    expect(api.listPeople).not.toHaveBeenCalled();
  });

  it('goes back to today with "Ver solo hoy"', async () => {
    const { api, element, button, settle, submitRange } = setup(() => of([person('0001')]));
    await settle();
    submitRange('2026-11-10', '2026-11-12');
    await settle();

    button('Ver solo hoy')!.click();
    await settle();

    expect(api.listPeople).toHaveBeenLastCalledWith('', { from: startOfToday() });
    expect(element.textContent).toContain('Mostrando las conversaciones con mensajes de hoy');
    expect(button('Ver solo hoy')).toBeUndefined();
  });

  it('does not search again when the same range is submitted twice', async () => {
    const { api, settle, submitRange } = setup(() => of([]));
    await settle();
    submitRange('2026-11-10', '2026-11-12');
    await settle();
    api.listPeople.mockClear();

    submitRange('2026-11-10', '2026-11-12');
    await settle();

    expect(api.listPeople).not.toHaveBeenCalled();
  });

  it('combines the text search with the range', async () => {
    vi.useFakeTimers();
    try {
      const { api, settle, type, submitRange } = setup(() => of([]));
      await settle();

      submitRange('2026-11-10', '2026-11-12');
      type('#search', 'maria');
      await vi.advanceTimersByTimeAsync(400);
      await settle();

      expect(api.listPeople).toHaveBeenLastCalledWith('maria', { from: new Date(2026, 10, 10), to: new Date(2026, 10, 13) });
    } finally {
      vi.useRealTimers();
    }
  });

  it('tells apart "no results for that range" and "no results for that search"', async () => {
    vi.useFakeTimers();
    try {
      const { element, settle, type, submitRange } = setup(() => of([]));
      await settle();

      submitRange('2026-11-10', '2026-11-12');
      await settle();
      expect(element.textContent).toContain('No hay conversaciones en ese rango');
      expect(element.textContent).toContain('Prueba con otras fechas');

      type('#search', 'zzz');
      await vi.advanceTimersByTimeAsync(400);
      await settle();
      expect(element.textContent).toContain('Prueba con otro nombre o número de teléfono');
    } finally {
      vi.useRealTimers();
    }
  });

  it('offers a retry when loading fails', async () => {
    const { element, button, settle } = setup(() => throwError(() => new Error('boom')));
    await settle();

    expect(element.querySelector('[role=alert]')?.textContent).toContain('No se pudieron cargar las conversaciones');
    expect(button('Reintentar')).toBeDefined();
  });
});
