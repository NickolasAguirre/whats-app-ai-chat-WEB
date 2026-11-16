import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SupportCase } from '../../core/domain/models/models';
import { BOT_API_URL } from './bot-api-url';
import { HttpCasesApi } from './http-cases-api';

const BASE = 'http://bot.test';

const dto = {
  id: 'c1',
  personId: 'p1',
  personPhone: '+57300',
  summary: 'Pedido',
  status: 'open',
  source: 'ai',
  createdAt: '2026-11-15T10:00:00.000Z',
  updatedAt: '2026-11-15T11:00:00.000Z',
  resolvedAt: null,
};

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), { provide: BOT_API_URL, useValue: BASE }, HttpCasesApi],
  });
  return { api: TestBed.inject(HttpCasesApi), http: TestBed.inject(HttpTestingController) };
}

describe('HttpCasesApi', () => {
  it('lists cases with the status filter and converts the dates', () => {
    const { api, http } = setup();
    let result: SupportCase[] = [];
    api.list('open').subscribe((value) => (result = value));

    const request = http.expectOne((req) => req.url === `${BASE}/admin/cases`);
    expect(request.request.params.get('status')).toBe('open');
    request.flush([{ ...dto, resolvedAt: '2026-11-16T09:00:00.000Z' }]);

    expect(result[0].createdAt).toEqual(new Date('2026-11-15T10:00:00.000Z'));
    expect(result[0].resolvedAt).toEqual(new Date('2026-11-16T09:00:00.000Z'));
  });

  it('lists every case when no status is given', () => {
    const { api, http } = setup();
    api.list().subscribe();

    const request = http.expectOne((req) => req.url === `${BASE}/admin/cases`);
    expect(request.request.params.has('status')).toBe(false);
    request.flush([]);
  });

  it('keeps a null resolvedAt as null', () => {
    const { api, http } = setup();
    let result: SupportCase | undefined;
    api.get('c1').subscribe((value) => (result = value));

    http.expectOne(`${BASE}/admin/cases/c1`).flush(dto);

    expect(result?.resolvedAt).toBeNull();
  });

  it('creates a case for a person with the summary', () => {
    const { api, http } = setup();
    api.create('p1', 'No pudo pagar').subscribe();

    const request = http.expectOne(`${BASE}/admin/cases`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ personId: 'p1', summary: 'No pudo pagar' });
    request.flush({ ...dto, source: 'manual' });
  });

  it('patches only what it is given', () => {
    const { api, http } = setup();
    api.update('c1', { status: 'resolved', note: 'Listo' }).subscribe();

    const request = http.expectOne(`${BASE}/admin/cases/c1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'resolved', note: 'Listo' });
    request.flush({ ...dto, status: 'resolved' });
  });

  it('turns a server error into a readable Error', () => {
    const { api, http } = setup();
    let error: Error | undefined;
    api.update('c1', { note: 'x' }).subscribe({ error: (failure: Error) => (error = failure) });

    http.expectOne(`${BASE}/admin/cases/c1`).flush({ message: 'Caso no encontrado.' }, { status: 404, statusText: 'Not Found' });

    expect(error?.message).toBe('Caso no encontrado.');
  });
});
