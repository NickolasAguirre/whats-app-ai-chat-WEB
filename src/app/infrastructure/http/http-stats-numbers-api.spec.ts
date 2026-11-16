import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardStats } from '../../core/domain/models/models';
import { BOT_API_URL } from './bot-api-url';
import { HttpStatsApi } from './http-stats-api';
import { HttpWhatsAppNumbersApi } from './http-whatsapp-numbers-api';

const BASE = 'http://bot.test';

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: BOT_API_URL, useValue: BASE },
      HttpStatsApi,
      HttpWhatsAppNumbersApi,
    ],
  });
  return {
    stats: TestBed.inject(HttpStatsApi),
    numbers: TestBed.inject(HttpWhatsAppNumbersApi),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('HttpStatsApi', () => {
  it('asks for the period with the browser time-zone offset and converts the failure dates', () => {
    const { stats, http } = setup();
    let result: DashboardStats | undefined;
    stats.get('week').subscribe((value) => (result = value));

    const request = http.expectOne((req) => req.url === `${BASE}/admin/stats`);
    expect(request.request.params.get('period')).toBe('week');
    expect(request.request.params.get('tzOffset')).toBe(String(new Date().getTimezoneOffset()));
    request.flush({
      period: 'week',
      summary: { answered: 1, received: 2, people: 1, newPeople: 1, avgResponseSeconds: 3, failed: 0 },
      previous: { answered: 0, people: 0, avgResponseSeconds: 0, failed: 0 },
      series: [],
      byNumber: [],
      heatmap: [],
      failedMessages: [{ id: 'f1', at: '2026-11-15T10:00:00.000Z', personName: 'Ana', reason: 'x' }],
    });

    expect(result?.failedMessages[0].at).toEqual(new Date('2026-11-15T10:00:00.000Z'));
    expect(result?.summary.answered).toBe(1);
  });

  it('turns a server error into a readable Error', () => {
    const { stats, http } = setup();
    let error: Error | undefined;
    stats.get('day').subscribe({ error: (failure: Error) => (error = failure) });

    http
      .expectOne((req) => req.url === `${BASE}/admin/stats`)
      .flush({ message: ['"period" debe ser day, week o month.'] }, { status: 400, statusText: 'Bad Request' });

    expect(error?.message).toContain('"period" debe ser');
  });
});

describe('HttpWhatsAppNumbersApi', () => {
  it('lists the numbers and fetches one by id', () => {
    const { numbers, http } = setup();
    const number = { id: 'default', phoneNumber: '+57300', wabaId: '', label: 'Ventas', active: true };
    let list: unknown;
    let single: unknown;

    numbers.list().subscribe((value) => (list = value));
    http.expectOne(`${BASE}/admin/numbers`).flush([number]);
    numbers.getById('default').subscribe((value) => (single = value));
    http.expectOne(`${BASE}/admin/numbers/default`).flush(number);

    expect(list).toEqual([number]);
    expect(single).toEqual(number);
  });

  it('reports a missing number with the message from the bot', () => {
    const { numbers, http } = setup();
    let error: Error | undefined;
    numbers.getById('nope').subscribe({ error: (failure: Error) => (error = failure) });

    http.expectOne(`${BASE}/admin/numbers/nope`).flush({ message: 'Número no encontrado.' }, { status: 404, statusText: 'Not Found' });

    expect(error?.message).toBe('Número no encontrado.');
  });
});
