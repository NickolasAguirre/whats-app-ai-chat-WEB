import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { InstructionsApi } from '../../core/domain/ports/instructions-api.port';
import { KnowledgeApi } from '../../core/domain/ports/knowledge-api.port';
import { InstructionsPage } from './instructions-page';

describe('InstructionsPage', () => {
  function setup(tab?: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: InstructionsApi, useValue: { get: () => of({ content: 'Hola', updatedAt: new Date(), isDefault: false }), save: vi.fn() } },
        { provide: KnowledgeApi, useValue: { list: () => of([]), upload: vi.fn(), createNote: vi.fn(), updateNote: vi.fn(), remove: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(InstructionsPage);
    if (tab) fixture.componentRef.setInput('tab', tab);
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows the editor by default', async () => {
    const { fixture, element } = setup();
    await fixture.whenStable();
    expect(element.querySelector('app-instructions-editor')).not.toBeNull();
    expect(element.querySelector('app-knowledge-panel')).toBeNull();
    expect(element.querySelector('#tab-instructions')?.getAttribute('aria-selected')).toBe('true');
  });

  it('opens the knowledge tab from the query parameter and switches on click', async () => {
    const { fixture, element } = setup('knowledge');
    await fixture.whenStable();
    expect(element.querySelector('app-knowledge-panel')).not.toBeNull();

    element.querySelector<HTMLButtonElement>('#tab-instructions')!.click();
    await fixture.whenStable();
    expect(element.querySelector('app-instructions-editor')).not.toBeNull();
  });
});
