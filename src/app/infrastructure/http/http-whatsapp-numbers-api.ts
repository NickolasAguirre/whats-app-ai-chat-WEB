import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { WhatsAppNumber } from '../../core/domain/models/models';
import { WhatsAppNumbersApi } from '../../core/domain/ports/whatsapp-numbers-api.port';
import { toApiError } from './api-error';
import { BOT_API_URL } from './bot-api-url';

@Injectable()
export class HttpWhatsAppNumbersApi extends WhatsAppNumbersApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(BOT_API_URL)}/admin/numbers`;

  override list(): Observable<WhatsAppNumber[]> {
    return this.http.get<WhatsAppNumber[]>(this.url).pipe(catchError((error) => throwError(() => toApiError(error))));
  }

  override getById(id: string): Observable<WhatsAppNumber> {
    return this.http
      .get<WhatsAppNumber>(`${this.url}/${encodeURIComponent(id)}`)
      .pipe(catchError((error) => throwError(() => toApiError(error))));
  }
}
