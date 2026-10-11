import { Injectable } from '@angular/core';
import { Observable, defer, of, throwError } from 'rxjs';
import { ConversationMessage, Person } from '../../core/domain/models/models';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { withMockLatency } from './mock-latency';

const MINUTE_MS = 60_000;

interface Seed {
  id: string;
  phoneNumber: string;
  name?: string;
  turns: [string, string][];
}

const SEEDS: Seed[] = [
  {
    id: 'per-1',
    phoneNumber: '+57 301 555 0101',
    name: 'María Gómez',
    turns: [
      ['Hola, ¿tienen disponibilidad para mañana?', 'Hola María, sí. ¿Para cuántas personas sería?'],
      ['Para cuatro, a las 7 pm.', 'Perfecto, queda reservado para cuatro personas a las 7 pm.'],
    ],
  },
  {
    id: 'per-2',
    phoneNumber: '+57 302 555 0202',
    turns: [['¿Cuál es el horario de atención?', 'Atendemos de lunes a sábado de 8 am a 6 pm.']],
  },
  {
    id: 'per-3',
    phoneNumber: '+57 303 555 0303',
    name: 'Carlos Ruiz',
    turns: [
      ['Quiero cambiar mi pedido', 'Claro, ¿me compartes el número del pedido?'],
      ['PED-2041', 'Encontré tu pedido. ¿Qué te gustaría cambiar?'],
      ['La dirección de entrega', 'Listo, indícame la nueva dirección.'],
    ],
  },
];

@Injectable()
export class MockConversationsApi extends ConversationsApi {
  private readonly now = Date.now();
  private readonly messages: ConversationMessage[] = this.buildMessages();
  private readonly people: Person[] = this.buildPeople();

  override listPeople(search: string): Observable<Person[]> {
    return defer(() => {
      const term = search.trim().toLowerCase();
      const result = this.people.filter(
        (person) =>
          !term || person.phoneNumber.includes(term) || (person.name ?? '').toLowerCase().includes(term),
      );
      return of(result.map((person) => ({ ...person })));
    }).pipe(withMockLatency());
  }

  override getPerson(personId: string): Observable<Person> {
    return defer(() => {
      const found = this.people.find((person) => person.id === personId);
      return found ? of({ ...found }) : throwError(() => new Error('Persona no encontrada'));
    }).pipe(withMockLatency());
  }

  override listMessages(personId: string): Observable<ConversationMessage[]> {
    return defer(() => of(this.messages.filter((message) => message.personId === personId))).pipe(
      withMockLatency(),
    );
  }

  private buildMessages(): ConversationMessage[] {
    return SEEDS.flatMap((seed, seedIndex) =>
      seed.turns.flatMap(([userText, assistantText], turnIndex) => {
        const base = this.now - (seedIndex * 90 + (seed.turns.length - turnIndex) * 5) * MINUTE_MS;
        return [
          { id: `${seed.id}-${turnIndex}-u`, personId: seed.id, role: 'user' as const, text: userText, timestamp: new Date(base) },
          { id: `${seed.id}-${turnIndex}-a`, personId: seed.id, role: 'assistant' as const, text: assistantText, timestamp: new Date(base + MINUTE_MS) },
        ];
      }),
    );
  }

  private buildPeople(): Person[] {
    return SEEDS.map((seed) => {
      const last = this.messages.filter((message) => message.personId === seed.id).at(-1)!;
      return {
        id: seed.id,
        phoneNumber: seed.phoneNumber,
        name: seed.name,
        lastMessageAt: last.timestamp,
        lastMessagePreview: last.text,
      };
    }).sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }
}
