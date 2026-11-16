import { Observable } from 'rxjs';
import { DateRange, MessagesPage, MessagesQuery, Person } from '../models/models';

export abstract class ConversationsApi {
  /** With a range, only people with messages in it, and their last message is the last one inside the range. */
  abstract listPeople(search: string, range?: DateRange): Observable<Person[]>;
  abstract getPerson(personId: string): Observable<Person>;
  abstract listMessages(personId: string, query?: MessagesQuery): Observable<MessagesPage>;
}
