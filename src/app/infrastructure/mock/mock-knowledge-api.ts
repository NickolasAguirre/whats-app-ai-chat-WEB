import { Injectable } from '@angular/core';
import { Observable, concatWith, defer, interval, map, of, take, throwError } from 'rxjs';
import { kindOfFile } from '../../core/domain/knowledge/file-rules';
import { KnowledgeItem, KnowledgeKind, NoteInput, UploadEvent } from '../../core/domain/models/models';
import { KnowledgeApi } from '../../core/domain/ports/knowledge-api.port';
import { withMockLatency } from './mock-latency';

const PROGRESS_STEPS = 10;
const PROGRESS_INTERVAL_MS = 150;
const PROCESSING_MS = 4000;
const OCR_PROCESSING_MS = 7000;
const FAILURE_MARKER = 'error';

interface StoredItem {
  id: string;
  kind: KnowledgeKind;
  title: string;
  createdAt: Date;
  sizeBytes?: number;
  content?: string;
  readyAt: number;
  fails: boolean;
}

@Injectable()
export class MockKnowledgeApi extends KnowledgeApi {
  private nextId = 1;
  private readonly store: StoredItem[] = [
    { id: 'kn-seed-1', kind: 'pdf', title: 'Catálogo de productos.pdf', createdAt: new Date(Date.now() - 3 * 86_400_000), sizeBytes: 2_480_113, readyAt: 0, fails: false },
    { id: 'kn-seed-2', kind: 'spreadsheet', title: 'Lista de precios.xlsx', createdAt: new Date(Date.now() - 86_400_000), sizeBytes: 148_902, readyAt: 0, fails: false },
    { id: 'kn-seed-3', kind: 'note', title: 'Horario de atención', createdAt: new Date(Date.now() - 2 * 86_400_000), content: 'Atendemos de lunes a sábado de 8 am a 6 pm. Los domingos no hay servicio.', readyAt: 0, fails: false },
  ];

  override list(): Observable<KnowledgeItem[]> {
    return defer(() => of(this.snapshot())).pipe(withMockLatency());
  }

  override upload(file: File): Observable<UploadEvent> {
    const progress = interval(PROGRESS_INTERVAL_MS).pipe(
      take(PROGRESS_STEPS),
      map((step): UploadEvent => ({ type: 'progress', percent: (step + 1) * (100 / PROGRESS_STEPS) })),
    );
    const done = defer(() => {
      const kind = kindOfFile(file.name) ?? 'text';
      const processingMs = kind === 'image' ? OCR_PROCESSING_MS : PROCESSING_MS;
      const stored = this.add({
        kind,
        title: file.name,
        sizeBytes: file.size,
        readyAt: Date.now() + processingMs,
        fails: file.name.toLowerCase().includes(FAILURE_MARKER),
      });
      return of<UploadEvent>({ type: 'done', item: this.toItem(stored) });
    });
    return progress.pipe(concatWith(done));
  }

  override createNote(input: NoteInput): Observable<KnowledgeItem> {
    return defer(() => of(this.toItem(this.add({ kind: 'note', title: input.title, content: input.content, readyAt: 0, fails: false })))).pipe(
      withMockLatency(),
    );
  }

  override updateNote(id: string, input: NoteInput): Observable<KnowledgeItem> {
    return defer(() => {
      const stored = this.store.find((entry) => entry.id === id && entry.kind === 'note');
      if (!stored) return throwError(() => new Error('Nota no encontrada'));
      stored.title = input.title;
      stored.content = input.content;
      return of(this.toItem(stored));
    }).pipe(withMockLatency());
  }

  override remove(id: string): Observable<void> {
    return defer(() => {
      const index = this.store.findIndex((entry) => entry.id === id);
      if (index === -1) return throwError(() => new Error('Elemento no encontrado'));
      this.store.splice(index, 1);
      return of(undefined);
    }).pipe(withMockLatency());
  }

  private add(partial: Omit<StoredItem, 'id' | 'createdAt'>): StoredItem {
    const stored: StoredItem = { ...partial, id: `kn-${this.nextId++}`, createdAt: new Date() };
    this.store.unshift(stored);
    return stored;
  }

  private snapshot(): KnowledgeItem[] {
    return this.store.map((stored) => this.toItem(stored)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private toItem(stored: StoredItem): KnowledgeItem {
    const finished = Date.now() >= stored.readyAt;
    const status = !finished ? 'processing' : stored.fails ? 'failed' : 'ready';
    return {
      id: stored.id,
      kind: stored.kind,
      title: stored.title,
      createdAt: stored.createdAt,
      sizeBytes: stored.sizeBytes,
      content: stored.content,
      status,
      errorMessage: status === 'failed' ? 'No se pudo leer el contenido del archivo.' : undefined,
    };
  }
}
