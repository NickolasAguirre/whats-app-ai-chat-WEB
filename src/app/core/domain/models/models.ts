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

export type StatsPeriod = 'day' | 'week' | 'month';

export interface StatsSummary {
  answered: number;
  received: number;
  people: number;
  newPeople: number;
  avgResponseSeconds: number;
  failed: number;
}

export interface StatsPoint {
  label: string;
  description: string;
  value: number;
}

export interface NumberStat {
  numberId: string;
  label: string;
  phoneNumber: string;
  answered: number;
}

export interface FailedMessage {
  id: string;
  at: Date;
  personName: string;
  reason: string;
}

export interface DashboardStats {
  period: StatsPeriod;
  summary: StatsSummary;
  previous: Pick<StatsSummary, 'answered' | 'people' | 'avgResponseSeconds' | 'failed'>;
  series: StatsPoint[];
  byNumber: NumberStat[];
  /** Messages answered over the last 4 weeks: 7 weekdays (Monday first) by 8 blocks of 3 hours. */
  heatmap: number[][];
  failedMessages: FailedMessage[];
}
