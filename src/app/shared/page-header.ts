import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="mb-6 sm:mb-8">
      <h1 class="text-2xl font-semibold sm:text-3xl">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="mt-2 max-w-[60ch] text-muted">{{ subtitle() }}</p>
      }
    </header>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
