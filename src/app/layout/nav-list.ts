import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../shared/icon';
import { NAV_LINKS } from './nav-links';

@Component({
  selector: 'app-nav-list',
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <nav aria-label="Principal">
      <ul class="flex flex-col gap-1">
        @for (link of links; track link.path) {
          <li>
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-primary-soft text-primary"
              ariaCurrentWhenActive="page"
              (click)="navigated.emit()"
              class="flex min-h-11 items-center gap-3 rounded-lg px-3 font-medium text-muted transition hover:bg-primary-soft hover:text-fg active:scale-[0.98]"
              [class]="rail() ? 'md:justify-center lg:justify-start' : ''"
            >
              <app-icon [name]="link.icon" />
              <span [class]="rail() ? 'md:sr-only lg:not-sr-only' : ''">{{ link.label }}</span>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class NavList {
  protected readonly links = NAV_LINKS;
  readonly rail = input(false);
  readonly navigated = output<void>();
}
