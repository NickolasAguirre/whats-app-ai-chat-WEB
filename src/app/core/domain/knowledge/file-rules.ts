import { KnowledgeFileKind } from '../models/models';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 20;

const KIND_BY_EXTENSION: Record<string, KnowledgeFileKind> = {
  pdf: 'pdf',
  xlsx: 'spreadsheet',
  xls: 'spreadsheet',
  csv: 'spreadsheet',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  txt: 'text',
  md: 'text',
};

export const ACCEPT_ATTRIBUTE = Object.keys(KIND_BY_EXTENSION)
  .map((extension) => `.${extension}`)
  .join(',');

export interface Rejection {
  name: string;
  reason: string;
}

export interface FileValidation {
  accepted: File[];
  rejected: Rejection[];
}

export function kindOfFile(name: string): KnowledgeFileKind | null {
  const extension = name.split('.').at(-1)?.toLowerCase() ?? '';
  return name.includes('.') ? (KIND_BY_EXTENSION[extension] ?? null) : null;
}

export function validateFiles(files: readonly File[], currentCount: number): FileValidation {
  const accepted: File[] = [];
  const rejected: Rejection[] = [];

  for (const file of files) {
    if (kindOfFile(file.name) === null) {
      rejected.push({ name: file.name, reason: 'Tipo no admitido. Usa PDF, Excel, imágenes, TXT o MD.' });
    } else if (file.size === 0) {
      rejected.push({ name: file.name, reason: 'El archivo está vacío.' });
    } else if (file.size > MAX_FILE_BYTES) {
      rejected.push({ name: file.name, reason: 'Supera el máximo de 10 MB.' });
    } else if (currentCount + accepted.length >= MAX_FILES) {
      rejected.push({ name: file.name, reason: `Ya alcanzaste el máximo de ${MAX_FILES} archivos.` });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejected };
}
