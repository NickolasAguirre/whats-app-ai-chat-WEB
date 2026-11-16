import { Observable } from 'rxjs';
import { MessagesPage, MessagesQuery, Person } from '../models/models';

export abstract class ConversationsApi {
  abstract listPeople(search: string): Observable<Person[]>;
  abstract getPerson(personId: string): Observable<Person>;
  abstract listMessages(personId: string, query?: MessagesQuery): Observable<MessagesPage>;
}
