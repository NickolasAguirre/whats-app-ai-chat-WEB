import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ConversationMessage, MessagesPage, MessagesQuery, MessageRole, Person } from '../../core/domain/models/models';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { toApiError } from './api-error';
import { BOT_API_URL } from './bot-api-url';

interface PersonDto {
  id: string;
  phoneNumber: string;
  name?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
}

interface MessageDto {
  id: string;
  personId: string;
  role: MessageRole;
  text: string;
  timestamp: string;
}

interface MessagesPageDto {
  /** Newest to oldest. */
  items: MessageDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

function toPerson(dto: PersonDto): Person {
  return { ...dto, lastMessageAt: new Date(dto.lastMessageAt) };
}

function toMessage(dto: MessageDto): ConversationMessage {
  return { ...dto, timestamp: new Date(dto.timestamp) };
}

@Injectable()
export class HttpConversationsApi extends ConversationsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(BOT_API_URL)}/admin/people`;

  override listPeople(search: string): Observable<Person[]> {
    const term = search.trim();
    const params = term ? new HttpParams().set('search', term) : new HttpParams();
    return this.http.get<PersonDto[]>(this.url, { params }).pipe(
      map((people) => people.map(toPerson)),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }

  override getPerson(personId: string): Observable<Person> {
    return this.http.get<PersonDto>(`${this.url}/${encodeURIComponent(personId)}`).pipe(
      map(toPerson),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }

  override listMessages(personId: string, query: MessagesQuery = {}): Observable<MessagesPage> {
    let params = new HttpParams();
    if (query.from) params = params.set('from', query.from.toISOString());
    if (query.to) params = params.set('to', query.to.toISOString());
    if (query.before) params = params.set('before', query.before);
    if (query.limit) params = params.set('limit', query.limit);

    return this.http.get<MessagesPageDto>(`${this.url}/${encodeURIComponent(personId)}/messages`, { params }).pipe(
      map((page) => ({
        items: page.items.map(toMessage).reverse(),
        cursor: page.nextCursor,
        hasMore: page.hasMore,
      })),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }
}
