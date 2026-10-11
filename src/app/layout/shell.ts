import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Icon } from '../shared/icon';
import { NavList } from './nav-list';
import { ThemeSwitch } from './theme-switch';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, NavList, ThemeSwitch, Icon],
  host: { '(document:keydown.escape)': 'closeMenu()' },
  template: `
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-40 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
    >
      Saltar al contenido
    </a>

    <div class="flex min-h-dvh">
      <aside
        class="sticky top-0 hidden h-dvh shrink-0 flex-col gap-8 border-r border-line bg-surface px-3 py-5 md:flex md:w-[4.5rem] lg:w-64 lg:px-4"
      >
        <div class="flex items-center gap-3 px-1 md:justify-center lg:justify-start lg:px-2">
          <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg">
            <app-icon name="chat" size="size-5" />
          </span>
          <span class="font-semibold leading-tight md:sr-only lg:not-sr-only">Panel del bot</span>
        </div>
        <app-nav-list [rail]="true" />
        <p class="mt-auto hidden rounded-lg bg-sunken p-3 text-sm text-muted lg:block">
          Modo demostración. Los datos que ves son de ejemplo.
        </p>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            class="-ml-2 inline-flex size-11 items-center justify-center rounded-lg transition hover:bg-primary-soft active:scale-[0.96] md:hidden"
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            [attr.aria-expanded]="menuOpen()"
            (click)="menuOpen.set(true)"
          >
            <app-icon name="menu" size="size-6" />
          </button>
          <p class="font-semibold md:hidden">Panel del bot</p>

          <div class="ml-auto flex items-center gap-3">
            <span class="hidden rounded-md bg-sunken px-2.5 py-1 text-xs font-medium text-muted sm:inline lg:hidden">
              Demostración
            </span>
            <app-theme-switch />
          </div>
        </header>

        <main id="main" tabindex="-1" class="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <router-outlet />
        </main>
      </div>
    </div>

    @if (menuOpen()) {
      <div class="fixed inset-0 z-40 md:hidden">
        <button type="button" class="absolute inset-0 bg-black/55" aria-label="Cerrar menú" (click)="closeMenu()"></button>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          class="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-8 bg-surface p-4 shadow-panel"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 px-1">
              <span class="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-fg">
                <app-icon name="chat" size="size-5" />
              </span>
              <span class="font-semibold">Panel del bot</span>
            </div>
            <button
              type="button"
              class="inline-flex size-11 items-center justify-center rounded-lg transition hover:bg-primary-soft active:scale-[0.96]"
              aria-label="Cerrar menú"
              (click)="closeMenu()"
            >
              <app-icon name="close" size="size-6" />
            </button>
          </div>
          <app-nav-list (navigated)="closeMenu()" />
          <p class="mt-auto rounded-lg bg-sunken p-3 text-sm text-muted">Modo demostración. Los datos que ves son de ejemplo.</p>
        </div>
      </div>
    }
  `,
})
export class Shell {
  protected readonly menuOpen = signal(false);

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
