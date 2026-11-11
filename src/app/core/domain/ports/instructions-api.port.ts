import { Observable } from 'rxjs';
import { Instructions } from '../models/models';

export abstract class InstructionsApi {
  abstract get(): Observable<Instructions>;
  abstract save(content: string): Observable<Instructions>;
  /** Removes the saved instructions so the bot goes back to its default behaviour. */
  abstract reset(): Observable<Instructions>;
}
