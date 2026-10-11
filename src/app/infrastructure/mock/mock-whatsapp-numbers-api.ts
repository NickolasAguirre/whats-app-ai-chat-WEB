import { Injectable } from '@angular/core';
import { Observable, defer, of, throwError } from 'rxjs';
import { WhatsAppNumber } from '../../core/domain/models/models';
import { WhatsAppNumbersApi } from '../../core/domain/ports/whatsapp-numbers-api.port';
import { withMockLatency } from './mock-latency';

const NUMBERS: WhatsAppNumber[] = [
  { id: 'num-1', phoneNumber: '+57 300 123 4567', wabaId: 'waba-1001', label: 'Atención al cliente', active: true },
  { id: 'num-2', phoneNumber: '+57 310 765 4321', wabaId: 'waba-1001', label: 'Ventas', active: true },
  { id: 'num-3', phoneNumber: '+57 320 111 2233', wabaId: 'waba-1002', label: 'Soporte técnico', active: false },
];

@Injectable()
export class MockWhatsAppNumbersApi extends WhatsAppNumbersApi {
  override list(): Observable<WhatsAppNumber[]> {
    return defer(() => of(NUMBERS.map((number) => ({ ...number })))).pipe(withMockLatency());
  }

  override getById(id: string): Observable<WhatsAppNumber> {
    return defer(() => {
      const found = NUMBERS.find((number) => number.id === id);
      return found ? of({ ...found }) : throwError(() => new Error('Número no encontrado'));
    }).pipe(withMockLatency());
  }
}
