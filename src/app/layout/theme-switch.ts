import { Component, inject } from '@angular/core';
import { Icon } from '../shared/icon';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-switch',
  imports: [Icon],
  template: `
    <div role="group" aria-label="Tema de color" class="inline-flex rounded-lg bg-sunken p-1">
      <button
        type="button"
        class="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition active:scale-[0.97]"
        [class]="theme.isDark() ? 'text-muted hover:text-fg' : 'bg-surface text-fg shadow-panel'"
        [attr.aria-pressed]="!theme.isDark()"
        aria-label="Tema claro"
        (click)="theme.set('light')"
      >
        <app-icon name="sun" size="size-4" />
        <span class="hidden sm:inline">Claro</span>
      </button>
      <button
        type="button"
        class="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition active:scale-[0.97]"
        [class]="theme.isDark() ? 'bg-surface text-fg shadow-panel' : 'text-muted hover:text-fg'"
        [attr.aria-pressed]="theme.isDark()"
        aria-label="Tema oscuro"
        (click)="theme.set('dark')"
      >
        <app-icon name="moon" size="size-4" />
        <span class="hidden sm:inline">Oscuro</span>
      </button>
    </div>
  `,
})
export class ThemeSwitch {
  protected readonly theme = inject(ThemeService);
}
