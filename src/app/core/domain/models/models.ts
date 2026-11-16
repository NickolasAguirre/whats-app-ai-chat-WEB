export interface Instructions {
  content: string;
  /** Null while the bot still uses the default behaviour (nothing saved yet). */
  updatedAt: Date | null;
  isDefault: boolean;
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

/** A range of instants: `from` is included, `to` is excluded. */
export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface MessagesQuery {
  /** Include messages from this instant. */
  from?: Date;
  /** Exclude messages from this instant. */
  to?: Date;
  /** Cursor of the oldest message already loaded: only older ones are returned. */
  before?: string;
  limit?: number;
}

export interface MessagesPage {
  /** Oldest to newest. */
  items: ConversationMessage[];
  /** Cursor of the oldest message in this page, null when the page is empty. */
  cursor: string | null;
  /** True when more messages exist inside the requested range. */
  hasMore: boolean;
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

export type CaseStatus = 'open' | 'in_progress' | 'resolved';
export type CaseSource = 'ai' | 'manual';

/** A case the AI could not solve, handled by hand by the call center. */
export interface SupportCase {
  id: string;
  personId: string;
  personName?: string;
  personPhone: string;
  summary: string;
  status: CaseStatus;
  source: CaseSource;
  assignee?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

export interface CasePatch {
  status?: CaseStatus;
  /** An empty string clears the value. */
  note?: string;
  assignee?: string;
}
