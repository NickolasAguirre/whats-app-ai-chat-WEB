import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { SupportCase } from '../../core/domain/models/models';
import { CasesApi } from '../../core/domain/ports/cases-api.port';
import { CaseDetailPage } from './case-detail-page';

const open: SupportCase = {
  id: 'c1',
  personId: 'p1',
  personName: 'María',
  personPhone: '+57 300 000 0001',
  summary: 'Cambio de dirección',
  status: 'open',
  source: 'ai',
  note: 'Primera nota',
  createdAt: new Date('2026-11-15T10:00:00Z'),
  updatedAt: new Date('2026-11-15T10:00:00Z'),
  resolvedAt: null,
};

describe('CaseDetailPage', () => {
  function setup(api: Partial<Record<keyof CasesApi, unknown>>) {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: CasesApi, useValue: api }] });
    const fixture = TestBed.createComponent(CaseDetailPage);
    fixture.componentRef.setInput('id', 'c1');
    const element = fixture.nativeElement as HTMLElement;
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const field = <T extends HTMLElement>(selector: string) => element.querySelector<T>(selector)!;
    const type = (selector: string, value: string) => {
      const target = field<HTMLInputElement>(selector);
      target.value = value;
      target.dispatchEvent(new Event('input'));
      target.dispatchEvent(new Event('change'));
    };
    const submit = () => element.querySelector('form')!.dispatchEvent(new Event('submit'));
    return { element, settle, field, type, submit, fixture };
  }

  it('shows the case, its origin and a link to the conversation, and fills the form with what is saved', async () => {
    const { element, field, settle } = setup({ get: vi.fn(() => of({ ...open, assignee: 'Laura' })) });
    await settle();

    expect(element.textContent).toContain('Cambio de dirección');
    expect(element.textContent).toContain('Detectado por la IA');
    expect(element.textContent).toContain('Todavía no');
    expect(element.querySelector('a[href="/whatsapp/conversations/p1"]')).not.toBeNull();
    expect(field<HTMLSelectElement>('#status').value).toBe('open');
    expect(field<HTMLInputElement>('#assignee').value).toBe('Laura');
    expect(field<HTMLTextAreaElement>('#note').value).toBe('Primera nota');
  });

  it('saves status, assignee and note and confirms the change', async () => {
    const update = vi.fn(() =>
      of({ ...open, status: 'resolved' as const, assignee: 'Laura', note: 'Resuelto por teléfono', resolvedAt: new Date('2026-11-16T09:00:00Z') }),
    );
    const { element, type, submit, settle } = setup({ get: vi.fn(() => of(open)), update });
    await settle();

    type('#status', 'resolved');
    type('#assignee', 'Laura');
    type('#note', 'Resuelto por teléfono');
    submit();
    await settle();

    expect(update).toHaveBeenCalledWith('c1', { status: 'resolved', assignee: 'Laura', note: 'Resuelto por teléfono' });
    expect(element.querySelector('[role=status]')?.textContent).toContain('Cambios guardados');
    expect(element.textContent).toContain('Resuelto');
  });

  it('shows the error from the bot when saving fails and keeps what was typed', async () => {
    const { element, field, type, submit, settle } = setup({
      get: vi.fn(() => of(open)),
      update: vi.fn(() => throwError(() => new Error('Caso no encontrado.'))),
    });
    await settle();

    type('#note', 'Mi nota');
    submit();
    await settle();

    expect(element.querySelector('[role=alert]')?.textContent).toContain('Caso no encontrado.');
    expect(field<HTMLTextAreaElement>('#note').value).toBe('Mi nota');
  });

  it('rejects a note over 2000 characters without calling the bot', async () => {
    const update = vi.fn();
    const { element, type, submit, settle } = setup({ get: vi.fn(() => of(open)), update });
    await settle();

    type('#note', 'a'.repeat(2001));
    submit();
    await settle();

    expect(update).not.toHaveBeenCalled();
    expect(element.querySelector('[role=alert]')?.textContent).toContain('2000');
  });

  it('keeps what is being typed when the case is reloaded unchanged', async () => {
    const get = vi.fn(() => of(open));
    const { field, type, fixture, settle } = setup({ get });
    await settle();

    type('#note', 'Escribiendo algo largo');
    fixture.detectChanges();
    (fixture.componentInstance as unknown as { item: { reload: () => void } }).item.reload();
    await settle();

    expect(get).toHaveBeenCalledTimes(2);
    expect(field<HTMLTextAreaElement>('#note').value).toBe('Escribiendo algo largo');
  });

  it('ignores a save answer that arrives after another case was opened', async () => {
    const late = new Subject<SupportCase>();
    const other = { ...open, id: 'c2', summary: 'Otro caso', note: undefined };
    const { element, fixture, submit, settle } = setup({
      get: vi.fn((id: string) => of(id === 'c2' ? other : open)),
      update: vi.fn(() => late),
    });
    await settle();

    submit();
    fixture.componentRef.setInput('id', 'c2');
    await settle();
    late.next({ ...open, status: 'resolved' });
    late.complete();
    await settle();

    expect(element.textContent).toContain('Otro caso');
    expect(element.textContent).not.toContain('Cambios guardados');
    expect(element.textContent).not.toContain('Cambio de dirección');
  });

  it('offers a retry when the case cannot be loaded', async () => {
    const { element, settle } = setup({ get: vi.fn(() => throwError(() => new Error('boom'))) });
    await settle();

    expect(element.querySelector('[role=alert]')?.textContent).toContain('No se pudo cargar el caso');
    expect([...element.querySelectorAll('button')].some((button) => button.textContent?.includes('Reintentar'))).toBe(true);
  });
});
