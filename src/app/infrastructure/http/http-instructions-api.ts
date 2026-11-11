import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { Instructions } from '../../core/domain/models/models';
import { InstructionsApi } from '../../core/domain/ports/instructions-api.port';
import { toApiError } from './api-error';
import { BOT_API_URL } from './bot-api-url';

interface InstructionsDto {
  content: string;
  updatedAt: string | null;
  isDefault: boolean;
}

function toInstructions(dto: InstructionsDto): Instructions {
  return { content: dto.content, updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : null, isDefault: dto.isDefault };
}

@Injectable()
export class HttpInstructionsApi extends InstructionsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(BOT_API_URL)}/admin/instructions`;

  override get(): Observable<Instructions> {
    return this.http.get<InstructionsDto>(this.url).pipe(map(toInstructions), catchError((error) => throwError(() => toApiError(error))));
  }

  override save(content: string): Observable<Instructions> {
    return this.http
      .put<InstructionsDto>(this.url, { content })
      .pipe(map(toInstructions), catchError((error) => throwError(() => toApiError(error))));
  }

  override reset(): Observable<Instructions> {
    return this.http.delete<void>(this.url).pipe(
      switchMap(() => this.get()),
      catchError((error) => throwError(() => toApiError(error))),
    );
  }
}
