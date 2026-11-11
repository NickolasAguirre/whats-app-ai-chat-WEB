import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UploadEvent } from '../../core/domain/models/models';
import { toApiError } from './api-error';
import { BOT_API_URL } from './bot-api-url';
import { HttpInstructionsApi } from './http-instructions-api';
import { HttpKnowledgeApi } from './http-knowledge-api';

const BASE = 'http://bot.test';

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: BOT_API_URL, useValue: BASE },
      HttpInstructionsApi,
      HttpKnowledgeApi,
    ],
  });
  return {
    instructions: TestBed.inject(HttpInstructionsApi),
    knowledge: TestBed.inject(HttpKnowledgeApi),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('HttpInstructionsApi', () => {
  it('reads the instructions and converts the ISO date to a Date', () => {
    const { instructions, http } = setup();
    let result: unknown;
    instructions.get().subscribe((value) => (result = value));

    const request = http.expectOne(`${BASE}/admin/instructions`);
    expect(request.request.method).toBe('GET');
    request.flush({ content: 'Hola', updatedAt: '2026-11-09T10:00:00.000Z', isDefault: false });

    expect(result).toEqual({ content: 'Hola', updatedAt: new Date('2026-11-09T10:00:00.000Z'), isDefault: false });
  });

  it('keeps updatedAt null while the default behaviour is in use', () => {
    const { instructions, http } = setup();
    let result: unknown;
    instructions.get().subscribe((value) => (result = value));

    http.expectOne(`${BASE}/admin/instructions`).flush({ content: 'Por defecto', updatedAt: null, isDefault: true });

    expect(result).toMatchObject({ updatedAt: null, isDefault: true });
  });

  it('saves with PUT and the content in the body', () => {
    const { instructions, http } = setup();
    instructions.save('Nuevo').subscribe();

    const request = http.expectOne(`${BASE}/admin/instructions`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ content: 'Nuevo' });
    request.flush({ content: 'Nuevo', updatedAt: '2026-11-09T10:00:00.000Z', isDefault: false });
  });

  it('resets with DELETE and then reads the default instructions', () => {
    const { instructions, http } = setup();
    let result: unknown;
    instructions.reset().subscribe((value) => (result = value));

    http.expectOne((req) => req.method === 'DELETE' && req.url === `${BASE}/admin/instructions`).flush(null);
    http.expectOne((req) => req.method === 'GET').flush({ content: 'Por defecto', updatedAt: null, isDefault: true });

    expect(result).toMatchObject({ isDefault: true });
  });

  it('surfaces the message sent by the bot', () => {
    const { instructions, http } = setup();
    let error: Error | undefined;
    instructions.save('').subscribe({ error: (value) => (error = value) });

    http
      .expectOne(`${BASE}/admin/instructions`)
      .flush({ message: ['Las instrucciones no pueden estar vacías.'] }, { status: 400, statusText: 'Bad Request' });

    expect(error?.message).toBe('Las instrucciones no pueden estar vacías.');
  });
});

describe('HttpKnowledgeApi', () => {
  const dto = { id: 'd1', kind: 'pdf', title: 'catálogo.pdf', status: 'processing', createdAt: '2026-11-09T10:00:00.000Z', sizeBytes: 10 };

  it('lists the items with real Date objects', () => {
    const { knowledge, http } = setup();
    let result: unknown[] = [];
    knowledge.list().subscribe((items) => (result = items));

    http.expectOne(`${BASE}/admin/knowledge`).flush([dto]);

    expect(result).toEqual([{ ...dto, createdAt: new Date('2026-11-09T10:00:00.000Z') }]);
  });

  it('uploads the file as multipart and emits progress and then done', () => {
    const { knowledge, http } = setup();
    const events: UploadEvent[] = [];
    knowledge.upload(new File(['hola'], 'catálogo.pdf')).subscribe((event) => events.push(event));

    const request = http.expectOne(`${BASE}/admin/knowledge/files`);
    expect(request.request.method).toBe('POST');
    expect((request.request.body as FormData).get('file')).toBeInstanceOf(File);
    expect(request.request.reportProgress).toBe(true);

    request.event({ type: 1, loaded: 50, total: 200 } as never);
    request.flush(dto);

    expect(events[0]).toEqual({ type: 'progress', percent: 25 });
    expect(events.at(-1)).toMatchObject({ type: 'done', item: { id: 'd1', createdAt: new Date('2026-11-09T10:00:00.000Z') } });
  });

  it('creates, updates and removes notes with the bot routes', () => {
    const { knowledge, http } = setup();

    knowledge.createNote({ title: 'T', content: 'C' }).subscribe();
    const created = http.expectOne(`${BASE}/admin/knowledge/notes`);
    expect(created.request.method).toBe('POST');
    created.flush({ ...dto, kind: 'note' });

    knowledge.updateNote('d1', { title: 'T2', content: 'C2' }).subscribe();
    const updated = http.expectOne(`${BASE}/admin/knowledge/notes/d1`);
    expect(updated.request.method).toBe('PUT');
    expect(updated.request.body).toEqual({ title: 'T2', content: 'C2' });
    updated.flush({ ...dto, kind: 'note' });

    knowledge.remove('d1').subscribe();
    const removed = http.expectOne(`${BASE}/admin/knowledge/d1`);
    expect(removed.request.method).toBe('DELETE');
    removed.flush(null);
  });

  it('shows the bot message when an upload is rejected', () => {
    const { knowledge, http } = setup();
    let error: Error | undefined;
    knowledge.upload(new File(['x'], 'virus.exe')).subscribe({ error: (value) => (error = value) });

    http
      .expectOne(`${BASE}/admin/knowledge/files`)
      .flush({ message: 'Tipo de archivo no admitido. Usa PDF, Excel, imágenes, TXT o MD.' }, { status: 400, statusText: 'Bad Request' });

    expect(error?.message).toBe('Tipo de archivo no admitido. Usa PDF, Excel, imágenes, TXT o MD.');
  });
});

describe('toApiError', () => {
  it('explains a lost connection and generic failures in Spanish', () => {
    expect(toApiError(new HttpErrorResponse({ status: 0 })).message).toBe('No se pudo conectar con el servidor.');
    expect(toApiError(new HttpErrorResponse({ status: 500, error: {} })).message).toBe('Ocurrió un error inesperado.');
    expect(toApiError('algo').message).toBe('Ocurrió un error inesperado.');
  });
});
