import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../shared/page-header';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, PageHeader],
  template: `
    <app-page-header title="No encontramos esa página" subtitle="La dirección no existe o fue movida." />
    <a
      routerLink="/"
      class="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-medium text-primary-fg transition hover:bg-primary-hover active:scale-[0.98]"
    >
      Volver al inicio
    </a>
  `,
})
export class NotFoundPage {}
