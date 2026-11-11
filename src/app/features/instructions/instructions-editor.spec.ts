import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Instructions } from '../../core/domain/models/models';
import { InstructionsApi } from '../../core/domain/ports/instructions-api.port';
import { InstructionsEditor } from './instructions-editor';

describe('InstructionsEditor', () => {
  const stored: Instructions = { content: 'Hola', updatedAt: new Date(2026, 9, 11), isDefault: false };
  const defaults: Instructions = { content: 'Texto por defecto', updatedAt: null, isDefault: true };

  function setup(initial: Instructions = stored) {
    const api = {
      get: vi.fn(() => of(initial)),
      save: vi.fn((content: string) => of({ ...stored, content })),
      reset: vi.fn(() => of(defaults)),
    };
    TestBed.configureTestingModule({ providers: [{ provide: InstructionsApi, useValue: api }] });
    const fixture = TestBed.createComponent(InstructionsEditor);
    return { api, fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('loads the stored instructions into the textarea', async () => {
    const { fixture, element } = setup();
    await fixture.whenStable();
    expect(element.querySelector('textarea')!.value).toBe('Hola');
  });

  it('enables saving only after the text changes, then saves it', async () => {
    const { api, fixture, element } = setup();
    await fixture.whenStable();
    const submit = element.querySelector<HTMLButtonElement>('button[type=submit]')!;
    expect(submit.disabled).toBe(true);

    const textarea = element.querySelector('textarea')!;
    textarea.value = 'Hola, bienvenido';
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(submit.disabled).toBe(false);

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(api.save).toHaveBeenCalledWith('Hola, bienvenido');
  });

  it('says the bot uses its default behaviour and hides the restore button when nothing is saved', async () => {
    const { fixture, element } = setup(defaults);
    await fixture.whenStable();

    expect(element.textContent).toContain('Usando el comportamiento por defecto');
    expect(element.textContent).not.toContain('Restaurar valor por defecto');
  });

  it('restores the default behaviour through the API', async () => {
    const { api, fixture, element } = setup();
    await fixture.whenStable();
    const restore = Array.from(element.querySelectorAll('button')).find((button) => button.textContent?.includes('Restaurar valor por defecto'))!;

    restore.click();
    await fixture.whenStable();

    expect(api.reset).toHaveBeenCalledOnce();
  });
});
