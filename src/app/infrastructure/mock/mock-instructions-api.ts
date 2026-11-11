import { Injectable } from '@angular/core';
import { Observable, defer, of } from 'rxjs';
import { Instructions } from '../../core/domain/models/models';
import { InstructionsApi } from '../../core/domain/ports/instructions-api.port';
import { withMockLatency } from './mock-latency';

const DEFAULT_CONTENT =
  'Eres el asistente virtual de atención al cliente del negocio. Responde siempre en español, con un lenguaje claro y formal. Sé breve y preciso. Si no conoces la respuesta o la información no está disponible, indícalo con honestidad y ofrece derivar la consulta a una persona.';

@Injectable()
export class MockInstructionsApi extends InstructionsApi {
  private current: Instructions = {
    content:
      'Eres el asistente virtual de atención al cliente del negocio. Responde siempre en español, de forma amable y breve. Si no conoces la respuesta, ofrece derivar la consulta a una persona.',
    updatedAt: new Date(),
    isDefault: false,
  };

  override get(): Observable<Instructions> {
    return defer(() => of({ ...this.current })).pipe(withMockLatency());
  }

  override save(content: string): Observable<Instructions> {
    return defer(() => {
      this.current = { content, updatedAt: new Date(), isDefault: false };
      return of({ ...this.current });
    }).pipe(withMockLatency());
  }

  override reset(): Observable<Instructions> {
    return defer(() => {
      this.current = { content: DEFAULT_CONTENT, updatedAt: null, isDefault: true };
      return of({ ...this.current });
    }).pipe(withMockLatency());
  }
}
