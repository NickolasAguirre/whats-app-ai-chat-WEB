import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessagesPage } from '../../core/domain/models/models';
import { BOT_API_URL } from './bot-api-url';
import { HttpConversationsApi } from './http-conversations-api';

const BASE = 'http://bot.test';

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), { provide: BOT_API_URL, useValue: BASE }, HttpConversationsApi],
  });
  return { api: TestBed.inject(HttpConversationsApi), http: TestBed.inject(HttpTestingController) };
}

describe('HttpConversationsApi', () => {
  it('lists people with the search term and converts dates', () => {
    const { api, http } = setup();
    let result: unknown;
    api.listPeople(' maria ').subscribe((value) => (result = value));

    const request = http.expectOne((req) => req.url === `${BASE}/admin/people`);
    expect(request.request.params.get('search')).toBe('maria');
    request.flush([{ id: 'p1', phoneNumber: '+57300', lastMessageAt: '2026-11-15T10:00:00.000Z', lastMessagePreview: 'hola' }]);

    expect(result).toEqual([
      { id: 'p1', phoneNumber: '+57300', lastMessageAt: new Date('2026-11-15T10:00:00.000Z'), lastMessagePreview: 'hola' },
    ]);
  });

  it('sends range, cursor and limit, and returns the page oldest to newest', () => {
    const { api, http } = setup();
    let page: MessagesPage | undefined;
    api
      .listMessages('p1', { from: new Date('2026-11-15T05:00:00.000Z'), before: 'cur', limit: 30 })
      .subscribe((value) => (page = value));

    const request = http.expectOne((req) => req.url === `${BASE}/admin/people/p1/messages`);
    expect(request.request.params.get('from')).toBe('2026-11-15T05:00:00.000Z');
    expect(request.request.params.get('before')).toBe('cur');
    expect(request.request.params.get('limit')).toBe('30');
    expect(request.request.params.has('to')).toBe(false);
    request.flush({
      items: [
        { id: 'b', personId: 'p1', role: 'assistant', text: 'segundo', timestamp: '2026-11-15T10:01:00.000Z' },
        { id: 'a', personId: 'p1', role: 'user', text: 'primero', timestamp: '2026-11-15T10:00:00.000Z' },
      ],
      nextCursor: 'oldest',
      hasMore: true,
    });

    expect(page?.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(page?.items[0].timestamp).toEqual(new Date('2026-11-15T10:00:00.000Z'));
    expect(page).toMatchObject({ cursor: 'oldest', hasMore: true });
  });

  it('turns a server error into a readable Error', () => {
    const { api, http } = setup();
    let error: Error | undefined;
    api.getPerson('p1').subscribe({ error: (failure: Error) => (error = failure) });

    http.expectOne(`${BASE}/admin/people/p1`).flush({ message: 'Persona no encontrada.' }, { status: 404, statusText: 'Not Found' });

    expect(error?.message).toBe('Persona no encontrada.');
  });
});
