import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, filter, map, throwError } from 'rxjs';
import { KnowledgeItem, NoteInput, UploadEvent } from '../../core/domain/models/models';
import { KnowledgeApi } from '../../core/domain/ports/knowledge-api.port';
import { toApiError } from './api-error';
import { BOT_API_URL } from './bot-api-url';

type KnowledgeItemDto = Omit<KnowledgeItem, 'createdAt'> & { createdAt: string };

function toKnowledgeItem(dto: KnowledgeItemDto): KnowledgeItem {
  return { ...dto, createdAt: new Date(dto.createdAt) };
}

@Injectable()
export class HttpKnowledgeApi extends KnowledgeApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(BOT_API_URL)}/admin/knowledge`;

  override list(): Observable<KnowledgeItem[]> {
    return this.http.get<KnowledgeItemDto[]>(this.url).pipe(
      map((items) => items.map(toKnowledgeItem)),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }

  override upload(file: File): Observable<UploadEvent> {
    const form = new FormData();
    form.append('file', file, file.name);

    return this.http.post<KnowledgeItemDto>(`${this.url}/files`, form, { reportProgress: true, observe: 'events' }).pipe(
      map((event): UploadEvent | null => {
        if (event.type === HttpEventType.UploadProgress) {
          return { type: 'progress', percent: event.total ? Math.round((100 * event.loaded) / event.total) : 0 };
        }
        if (event.type === HttpEventType.Response && event.body) {
          return { type: 'done', item: toKnowledgeItem(event.body) };
        }
        return null;
      }),
      filter((event): event is UploadEvent => event !== null),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }

  override createNote(input: NoteInput): Observable<KnowledgeItem> {
    return this.http.post<KnowledgeItemDto>(`${this.url}/notes`, input).pipe(
      map(toKnowledgeItem),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }

  override updateNote(id: string, input: NoteInput): Observable<KnowledgeItem> {
    return this.http.put<KnowledgeItemDto>(`${this.url}/notes/${encodeURIComponent(id)}`, input).pipe(
      map(toKnowledgeItem),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }

  override remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`).pipe(catchError((error) => throwError(() => toApiError(error))));
  }
}
