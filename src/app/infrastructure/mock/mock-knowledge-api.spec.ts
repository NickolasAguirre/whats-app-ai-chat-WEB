import { firstValueFrom, lastValueFrom, toArray } from 'rxjs';
import { MockKnowledgeApi } from './mock-knowledge-api';

describe('MockKnowledgeApi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits upload progress and then the created item as processing', async () => {
    const api = new MockKnowledgeApi();
    const events = await lastValueFrom(api.upload(new File(['x'], 'guia.pdf')).pipe(toArray()));

    expect(events.at(-1)?.type).toBe('done');
    expect(events.filter((event) => event.type === 'progress').length).toBeGreaterThan(1);

    const items = await firstValueFrom(api.list());
    expect(items.find((item) => item.title === 'guia.pdf')?.status).toBe('processing');
  });

  it('marks the item ready after the processing time, or failed for unreadable files', async () => {
    const api = new MockKnowledgeApi();
    await lastValueFrom(api.upload(new File(['x'], 'ok.pdf')));
    await lastValueFrom(api.upload(new File(['x'], 'roto-error.pdf')));

    const realNow = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(realNow + 60_000);
    const items = await firstValueFrom(api.list());

    expect(items.find((item) => item.title === 'ok.pdf')?.status).toBe('ready');
    expect(items.find((item) => item.title === 'roto-error.pdf')?.status).toBe('failed');
  });

  it('creates, updates and removes notes', async () => {
    const api = new MockKnowledgeApi();
    const created = await firstValueFrom(api.createNote({ title: 'Envíos', content: 'Enviamos en 48 horas.' }));
    expect(created.kind).toBe('note');

    const updated = await firstValueFrom(api.updateNote(created.id, { title: 'Envíos', content: 'Enviamos en 24 horas.' }));
    expect(updated.content).toBe('Enviamos en 24 horas.');

    await firstValueFrom(api.remove(created.id));
    const items = await firstValueFrom(api.list());
    expect(items.some((item) => item.id === created.id)).toBe(false);
  });
});
