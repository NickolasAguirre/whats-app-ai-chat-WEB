import { Observable } from 'rxjs';
import { WhatsAppNumber } from '../models/models';

export abstract class WhatsAppNumbersApi {
  abstract list(): Observable<WhatsAppNumber[]>;
  abstract getById(id: string): Observable<WhatsAppNumber>;
}
