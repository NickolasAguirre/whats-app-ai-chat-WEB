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
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 16v4h16v-4',
  file: 'M6 3h8l5 5v13H6z M14 3v5h5',
  table: 'M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14',
  image: 'M4 5h16v14H4z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M4 17l5-5 4 4 3-3 4 4',
  note: 'M5 4h14v12l-4 4H5z M15 20v-4h4 M8 9h8 M8 13h5',
  trash: 'M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13 M10 11v5 M14 11v5',
  pencil: 'M4 20l1-4L16 5l3 3L8 19z M14 7l3 3',
  plus: 'M12 5v14 M5 12h14',
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
