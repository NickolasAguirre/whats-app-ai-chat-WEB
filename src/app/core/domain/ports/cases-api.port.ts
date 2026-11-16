import { Observable } from 'rxjs';
import { CasePatch, CaseStatus, SupportCase } from '../models/models';

export abstract class CasesApi {
  /** Newest first; without a status, every case. */
  abstract list(status?: CaseStatus): Observable<SupportCase[]>;
  abstract get(id: string): Observable<SupportCase>;
  /** An agent registers a case by hand from a conversation. */
  abstract create(personId: string, summary: string): Observable<SupportCase>;
  abstract update(id: string, patch: CasePatch): Observable<SupportCase>;
}
