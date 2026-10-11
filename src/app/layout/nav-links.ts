import { IconName } from '../shared/icon';

export interface NavLink {
  path: string;
  label: string;
  icon: IconName;
}

export const NAV_LINKS: readonly NavLink[] = [
  { path: '/instructions', label: 'Instrucciones', icon: 'instructions' },
  { path: '/numbers', label: 'Números', icon: 'phone' },
  { path: '/conversations', label: 'Conversaciones', icon: 'chat' },
];
