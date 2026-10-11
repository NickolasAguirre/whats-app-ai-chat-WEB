import { Observable } from 'rxjs';
import { KnowledgeItem, NoteInput, UploadEvent } from '../models/models';

export abstract class KnowledgeApi {
  abstract list(): Observable<KnowledgeItem[]>;
  abstract upload(file: File): Observable<UploadEvent>;
  abstract createNote(input: NoteInput): Observable<KnowledgeItem>;
  abstract updateNote(id: string, input: NoteInput): Observable<KnowledgeItem>;
  abstract remove(id: string): Observable<void>;
}
