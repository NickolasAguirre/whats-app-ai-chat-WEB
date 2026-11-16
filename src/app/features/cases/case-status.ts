import { CaseSource, CaseStatus } from '../../core/domain/models/models';

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  open: 'Abierto',
  in_progress: 'En curso',
  resolved: 'Resuelto',
};

export const CASE_STATUS_BADGE: Record<CaseStatus, string> = {
  open: 'bg-danger-soft text-danger',
  in_progress: 'bg-primary-soft text-primary',
  resolved: 'bg-sunken text-muted',
};

export const CASE_SOURCE_LABEL: Record<CaseSource, string> = {
  ai: 'Detectado por la IA',
  manual: 'Registrado a mano',
};

export const CASE_STATUSES: CaseStatus[] = ['open', 'in_progress', 'resolved'];
