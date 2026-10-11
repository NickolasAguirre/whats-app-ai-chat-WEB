import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Instructions } from '../../core/domain/models/models';
import { InstructionsApi } from '../../core/domain/ports/instructions-api.port';
import { InstructionsPage } from './instructions-page';

describe('InstructionsPage', () => {
  const stored: Instructions = { content: 'Hola', updatedAt: new Date(2026, 9, 11) };

  function setup() {
    const api = { get: vi.fn(() => of(stored)), save: vi.fn((content: string) => of({ ...stored, content })) };
    TestBed.configureTestingModule({ providers: [{ provide: InstructionsApi, useValue: api }] });
    const fixture = TestBed.createComponent(InstructionsPage);
    return { api, fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('loads the stored instructions into the textarea', async () => {
    const { fixture, element } = setup();
    await fixture.whenStable();
    const textarea = element.querySelector('textarea')!;
    expect(textarea.value).toBe('Hola');
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
});
