import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { KnowledgeItem } from '../../../core/domain/models/models';
import { KnowledgeApi } from '../../../core/domain/ports/knowledge-api.port';
import { KnowledgePanel } from './knowledge-panel';

describe('KnowledgePanel', () => {
  const items: KnowledgeItem[] = [
    { id: '1', kind: 'pdf', title: 'Catálogo.pdf', status: 'ready', createdAt: new Date(2026, 9, 1), sizeBytes: 2048 },
    { id: '2', kind: 'note', title: 'Horarios', status: 'ready', createdAt: new Date(2026, 9, 2), content: 'Lunes a sábado.' },
  ];

  function setup() {
    const api = {
      list: vi.fn(() => of(items)),
      upload: vi.fn(() => of({ type: 'progress' as const, percent: 100 })),
      createNote: vi.fn(),
      updateNote: vi.fn(),
      remove: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({ providers: [{ provide: KnowledgeApi, useValue: api }] });
    const fixture = TestBed.createComponent(KnowledgePanel);
    return { api, fixture, element: fixture.nativeElement as HTMLElement };
  }

  function pick(element: HTMLElement, files: File[]): void {
    const input = element.querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  it('lists the stored files and notes with their status', async () => {
    const { fixture, element } = setup();
    await fixture.whenStable();

    expect(element.textContent).toContain('Catálogo.pdf');
    expect(element.textContent).toContain('Horarios');
    expect(element.textContent).toContain('Listo');
  });

  it('rejects unsupported files with a reason and does not upload them', async () => {
    const { api, fixture, element } = setup();
    await fixture.whenStable();

    pick(element, [new File(['x'], 'programa.exe')]);
    await fixture.whenStable();

    expect(element.textContent).toContain('programa.exe');
    expect(element.textContent).toContain('Tipo no admitido');
    expect(api.upload).not.toHaveBeenCalled();
  });

  it('uploads accepted files', async () => {
    const { api, fixture, element } = setup();
    await fixture.whenStable();

    pick(element, [new File(['x'], 'precios.xlsx')]);
    await fixture.whenStable();

    expect(api.upload).toHaveBeenCalledTimes(1);
  });

  it('keeps polling until no item is processing', async () => {
    vi.useFakeTimers();
    try {
      const processing: KnowledgeItem = { ...items[0], status: 'processing' };
      const { api, fixture, element } = setup();
      api.list
        .mockImplementationOnce(() => of([processing]))
        .mockImplementationOnce(() => of([processing]))
        .mockImplementation(() => of([items[0]]));

      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(3100);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(3100);
      fixture.detectChanges();

      expect(api.list).toHaveBeenCalledTimes(3);
      expect(element.textContent).toContain('Listo');
      await vi.advanceTimersByTimeAsync(10_000);
      expect(api.list).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('asks for confirmation before deleting an item', async () => {
    const { api, fixture, element } = setup();
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('button[aria-label="Eliminar Catálogo.pdf"]')!.click();
    await fixture.whenStable();
    expect(api.remove).not.toHaveBeenCalled();
    expect(element.textContent).toContain('¿Eliminar');

    [...element.querySelectorAll('button')].find((button) => button.textContent?.includes('Sí, eliminar'))!.click();
    expect(api.remove).toHaveBeenCalledWith('1');
  });
});
