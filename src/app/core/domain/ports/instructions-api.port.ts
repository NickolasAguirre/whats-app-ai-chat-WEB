import { Observable } from 'rxjs';
import { Instructions } from '../models/models';

export abstract class InstructionsApi {
  abstract get(): Observable<Instructions>;
  abstract save(content: string): Observable<Instructions>;
}
