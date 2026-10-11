export interface Instructions {
  content: string;
  updatedAt: Date;
}

export interface WhatsAppNumber {
  id: string;
  phoneNumber: string;
  wabaId: string;
  label: string;
  active: boolean;
}

export interface Person {
  id: string;
  phoneNumber: string;
  name?: string;
  lastMessageAt: Date;
  lastMessagePreview: string;
}

export type MessageRole = 'user' | 'assistant';

export interface ConversationMessage {
  id: string;
  personId: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
}

export type KnowledgeFileKind = 'pdf' | 'spreadsheet' | 'image' | 'text';
export type KnowledgeKind = KnowledgeFileKind | 'note';
export type KnowledgeStatus = 'processing' | 'ready' | 'failed';

export interface KnowledgeItem {
  id: string;
  kind: KnowledgeKind;
  title: string;
  status: KnowledgeStatus;
  createdAt: Date;
  sizeBytes?: number;
  content?: string;
  errorMessage?: string;
}

export interface NoteInput {
  title: string;
  content: string;
}

export type UploadEvent = { type: 'progress'; percent: number } | { type: 'done'; item: KnowledgeItem };
