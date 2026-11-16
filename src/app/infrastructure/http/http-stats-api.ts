import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { DashboardStats, FailedMessage, StatsPeriod } from '../../core/domain/models/models';
import { StatsApi } from '../../core/domain/ports/stats-api.port';
import { toApiError } from './api-error';
import { BOT_API_URL } from './bot-api-url';

type DashboardStatsDto = Omit<DashboardStats, 'failedMessages'> & {
  failedMessages: (Omit<FailedMessage, 'at'> & { at: string })[];
};

@Injectable()
export class HttpStatsApi extends StatsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(BOT_API_URL)}/admin/stats`;

  override get(period: StatsPeriod): Observable<DashboardStats> {
    // The bot groups by hour and day in the browser's time zone, so the offset travels with the request.
    const params = new HttpParams().set('period', period).set('tzOffset', new Date().getTimezoneOffset());
    return this.http.get<DashboardStatsDto>(this.url, { params }).pipe(
      map((dto) => ({ ...dto, failedMessages: dto.failedMessages.map((item) => ({ ...item, at: new Date(item.at) })) })),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }
}
