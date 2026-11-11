import { HttpErrorResponse } from '@angular/common/http';

/** Turns an HTTP failure into an Error whose message (already in Spanish) can be shown to the user. */
export function toApiError(error: unknown): Error {
  if (error instanceof HttpErrorResponse) {
    const message = (error.error as { message?: string | string[] } | null)?.message;
    const text = Array.isArray(message) ? message.join(' ') : message;
    return new Error(text || (error.status === 0 ? 'No se pudo conectar con el servidor.' : 'Ocurrió un error inesperado.'));
  }

  return error instanceof Error ? error : new Error('Ocurrió un error inesperado.');
}
