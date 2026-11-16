import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { CasePatch, CaseStatus, SupportCase } from '../../core/domain/models/models';
import { CasesApi } from '../../core/domain/ports/cases-api.port';
import { toApiError } from './api-error';
import { BOT_API_URL } from './bot-api-url';

type CaseDto = Omit<SupportCase, 'createdAt' | 'updatedAt' | 'resolvedAt'> & {
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

function toCase(dto: CaseDto): SupportCase {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    resolvedAt: dto.resolvedAt ? new Date(dto.resolvedAt) : null,
  };
}

@Injectable()
export class HttpCasesApi extends CasesApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(BOT_API_URL)}/admin/cases`;

  override list(status?: CaseStatus): Observable<SupportCase[]> {
    const params = status ? new HttpParams().set('status', status) : new HttpParams();
    return this.http.get<CaseDto[]>(this.url, { params }).pipe(
      map((cases) => cases.map(toCase)),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }

  override get(id: string): Observable<SupportCase> {
    return this.http.get<CaseDto>(`${this.url}/${encodeURIComponent(id)}`).pipe(
      map(toCase),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }

  override create(personId: string, summary: string): Observable<SupportCase> {
    return this.http.post<CaseDto>(this.url, { personId, summary }).pipe(
      map(toCase),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }

  override update(id: string, patch: CasePatch): Observable<SupportCase> {
    return this.http.patch<CaseDto>(`${this.url}/${encodeURIComponent(id)}`, patch).pipe(
      map(toCase),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }
}
