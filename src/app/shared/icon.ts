import { Component, computed, input } from '@angular/core';

const PATHS = {
  instructions: 'M6 3h8l5 5v13H6z M14 3v5h5 M9.5 13h6 M9.5 17h6',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z',
  chat: 'M20 12a8 8 0 01-11.6 7.1L4 20l1-4.5A8 8 0 1120 12z',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8z M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4',
  moon: 'M20 13.5A8 8 0 1110.5 4a6.5 6.5 0 009.5 9.5z',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  close: 'M6 6l12 12 M18 6L6 18',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M20 20l-4-4',
  back: 'M19 12H5 M11 6l-6 6 6 6',
  alert: 'M12 4l9 16H3z M12 10v4 M12 17.5v.01',
  inbox: 'M4 13l2-8h12l2 8v6H4z M4 13h5l1 2h4l1-2h5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
} as const;

export type IconName = keyof typeof PATHS;

@Component({
  selector: 'app-icon',
  host: { class: 'inline-flex shrink-0', 'aria-hidden': 'true' },
  template: `
    <svg [class]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path [attr.d]="path()" />
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input('size-5');
  protected readonly path = computed(() => PATHS[this.name()]);
}
