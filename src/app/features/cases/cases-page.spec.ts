import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CaseStatus, SupportCase } from '../../core/domain/models/models';
import { CasesApi } from '../../core/domain/ports/cases-api.port';
import { CasesPage } from './cases-page';

function supportCase(id: string, status: CaseStatus = 'open', extra: Partial<SupportCase> = {}): SupportCase {
  return {
    id,
    personId: 'p1',
    personPhone: '+57 300 000 0001',
    summary: `Resumen ${id}`,
    status,
    source: 'ai',
    createdAt: new Date('2026-11-15T10:00:00Z'),
    updatedAt: new Date('2026-11-15T10:00:00Z'),
    resolvedAt: null,
    ...extra,
  };
}

describe('CasesPage', () => {
  function setup(list: (status?: CaseStatus) => ReturnType<CasesApi['list']>) {
    const api = { list: vi.fn(list) };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: CasesApi, useValue: api }] });
    const fixture = TestBed.createComponent(CasesPage);
    const element = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      [...element.querySelectorAll('button')].find((candidate) => candidate.textContent?.trim() === label);
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { api, element, button, settle };
  }

  it('lists every case first, each linking to its detail with status, origin and assignee', async () => {
    const { api, element, settle } = setup(() =>
      of([supportCase('c1', 'open', { personName: 'María' }), supportCase('c2', 'in_progress', { source: 'manual', assignee: 'Laura' })]),
    );
    await settle();

    expect(api.list).toHaveBeenCalledWith(undefined);
    const links = [...element.querySelectorAll<HTMLAnchorElement>('ul a')];
    expect(links).toHaveLength(2);
    expect(links[0].textContent).toContain('Resumen c1');
    expect(links[0].textContent).toContain('Abierto');
    expect(links[0].textContent).toContain('María');
    expect(links[0].textContent).toContain('Detectado por la IA');
    expect(links[1].textContent).toContain('En curso');
    expect(links[1].textContent).toContain('Registrado a mano');
    expect(links[1].textContent).toContain('Atiende Laura');
  });

  it('shows the resolution date of a resolved case in the list', async () => {
    const { element, settle } = setup(() =>
      of([supportCase('c1', 'resolved', { resolvedAt: new Date('2026-11-16T09:00:00Z') }), supportCase('c2')]),
    );
    await settle();

    const rows = [...element.querySelectorAll('ul a')];
    expect(rows[0].textContent).toContain('Resuelto el');
    expect(rows[0].querySelectorAll('time')).toHaveLength(2);
    expect(rows[1].textContent).not.toContain('Resuelto el');
  });

  it('falls back to the phone number when the person has no name', async () => {
    const { element, settle } = setup(() => of([supportCase('c1')]));
    await settle();

    expect(element.querySelector('ul a')?.textContent).toContain('+57 300 000 0001');
  });

  it('filters by status when a filter button is pressed', async () => {
    const { api, button, settle } = setup((status) => of(status ? [supportCase('c9', status)] : []));
    await settle();

    button('Resuelto')?.click();
    await settle();
    expect(button('Resuelto')?.getAttribute('aria-pressed')).toBe('true');
    expect(api.list).toHaveBeenLastCalledWith('resolved');

    button('Abierto')?.click();
    await settle();
    expect(api.list).toHaveBeenLastCalledWith('open');
  });

  it('explains the empty state', async () => {
    const { element, settle } = setup(() => of([]));
    await settle();

    expect(element.textContent).toContain('No hay casos para mostrar');
  });

  it('offers a retry when loading fails', async () => {
    const { element, button, settle } = setup(() => throwError(() => new Error('boom')));
    await settle();

    expect(element.querySelector('[role=alert]')?.textContent).toContain('No se pudieron cargar los casos');
    expect(button('Reintentar')).toBeDefined();
  });
});
