import { Component, inject, input, linkedSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeader } from '../../shared/page-header';
import { InstructionsEditor } from './instructions-editor';
import { KnowledgePanel } from './knowledge/knowledge-panel';

type TabId = 'instructions' | 'knowledge';

const TABS: readonly { id: TabId; label: string }[] = [
  { id: 'instructions', label: 'Instrucciones' },
  { id: 'knowledge', label: 'Conocimiento' },
];

@Component({
  selector: 'app-instructions-page',
  imports: [InstructionsEditor, KnowledgePanel, PageHeader],
  template: `
    <app-page-header
      title="Instrucciones del bot"
      subtitle="Define cómo atiende el asistente y qué información tiene para responder a tus clientes."
    />

    <div role="tablist" aria-label="Secciones" class="mb-6 flex gap-1 border-b border-line" (keydown)="onKeydown($event)">
      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          role="tab"
          [id]="'tab-' + tab.id"
          [attr.aria-selected]="active() === tab.id"
          [attr.aria-controls]="'panel-' + tab.id"
          [attr.tabindex]="active() === tab.id ? 0 : -1"
          class="relative -mb-px min-h-11 px-4 font-medium transition after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-out after:content-[''] active:scale-[0.98]"
          [class]="active() === tab.id ? 'text-primary after:scale-x-100' : 'text-muted after:scale-x-0 hover:text-fg'"
          (click)="select(tab.id)"
        >
          {{ tab.label }}
        </button>
      }
    </div>

    @if (active() === 'instructions') {
      <div role="tabpanel" id="panel-instructions" aria-labelledby="tab-instructions" tabindex="0" animate.enter="tab-enter">
        <app-instructions-editor />
      </div>
    } @else {
      <div role="tabpanel" id="panel-knowledge" aria-labelledby="tab-knowledge" tabindex="0" animate.enter="tab-enter">
        <app-knowledge-panel />
      </div>
    }
  `,
})
export class InstructionsPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Bound from the `?tab=` query parameter. */
  readonly tab = input<string>();

  protected readonly tabs = TABS;
  protected readonly active = linkedSignal<TabId>(() => (this.tab() === 'knowledge' ? 'knowledge' : 'instructions'));

  protected select(id: TabId): void {
    this.active.set(id);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: id === 'instructions' ? null : id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = TABS.findIndex((tab) => tab.id === this.active());
    const next = TABS[(index + step + TABS.length) % TABS.length];
    this.select(next.id);
    queueMicrotask(() => document.getElementById(`tab-${next.id}`)?.focus());
  }
}
