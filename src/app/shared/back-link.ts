import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

@Component({
  selector: 'app-back-link',
  imports: [RouterLink, Icon],
  template: `
    <a
      [routerLink]="to()"
      class="-ml-2 mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted transition hover:bg-primary-soft hover:text-fg"
    >
      <app-icon name="back" size="size-4" />
      {{ label() }}
    </a>
  `,
})
export class BackLink {
  readonly to = input.required<string>();
  readonly label = input.required<string>();
}
