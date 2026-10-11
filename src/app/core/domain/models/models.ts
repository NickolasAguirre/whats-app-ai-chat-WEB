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
