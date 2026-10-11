import { firstValueFrom } from 'rxjs';
import { MockConversationsApi } from './mock-conversations-api';
import { MockInstructionsApi } from './mock-instructions-api';
import { MockWhatsAppNumbersApi } from './mock-whatsapp-numbers-api';

describe('MockInstructionsApi', () => {
  it('returns the instructions saved last', async () => {
    const api = new MockInstructionsApi();
    await firstValueFrom(api.save('Nuevas instrucciones'));
    const current = await firstValueFrom(api.get());
    expect(current.content).toBe('Nuevas instrucciones');
  });
});

describe('MockWhatsAppNumbersApi', () => {
  it('lists numbers and finds one by id', async () => {
    const api = new MockWhatsAppNumbersApi();
    const numbers = await firstValueFrom(api.list());
    const found = await firstValueFrom(api.getById(numbers[0].id));
    expect(found.id).toBe(numbers[0].id);
  });

  it('fails for an unknown id', async () => {
    const api = new MockWhatsAppNumbersApi();
    await expect(firstValueFrom(api.getById('missing'))).rejects.toThrow();
  });
});

describe('MockConversationsApi', () => {
  it('filters people by name or phone, most recent first', async () => {
    const api = new MockConversationsApi();
    const all = await firstValueFrom(api.listPeople(''));
    const times = all.map((person) => person.lastMessageAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));

    const filtered = await firstValueFrom(api.listPeople('carlos'));
    expect(filtered.map((person) => person.name)).toEqual(['Carlos Ruiz']);
  });

  it('returns only the messages of the requested person', async () => {
    const api = new MockConversationsApi();
    const messages = await firstValueFrom(api.listMessages('per-2'));
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.every((message) => message.personId === 'per-2')).toBe(true);
  });
});
