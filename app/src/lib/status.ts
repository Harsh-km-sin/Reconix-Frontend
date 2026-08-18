import type { JobStatus, JobItemStatus } from '@/types';

/**
 * The semantic weight of a status. Everything that renders a status picks a
 * tone; only this file decides which classes a tone maps to, so restyling all
 * badges is a one-line change.
 */
export type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

/** A status resolved to what the UI needs: what to write, and how to weight it. */
export interface StatusMeta {
  label: string;
  tone: Tone;
}

/** Tailwind classes for a tone's soft badge (tinted background, solid text). */
export const toneBadgeClasses: Record<Tone, string> = {
  brand: 'bg-brand-light text-brand',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  neutral: 'bg-line-light text-ink-light',
};

/** Tailwind classes for a tone's solid badge (solid background, white text). */
export const toneSolidClasses: Record<Tone, string> = {
  brand: 'bg-brand text-white',
  success: 'bg-success text-white',
  warning: 'bg-warning text-white',
  danger: 'bg-danger text-white',
  neutral: 'bg-ink-light text-white',
};

const UNKNOWN: StatusMeta = { label: 'Unknown', tone: 'neutral' };

// ── 1. Job status ───────────────────────────────────────────────────────────
const JOB_STATUS: Record<JobStatus, StatusMeta> = {
  PENDING: { label: 'Pending', tone: 'warning' },
  RUNNING: { label: 'Running', tone: 'brand' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
  PARTIAL: { label: 'Partial', tone: 'warning' },
};

export const jobStatus = (status: JobStatus): StatusMeta => JOB_STATUS[status] ?? UNKNOWN;

// ── 2. Job item status ──────────────────────────────────────────────────────
const JOB_ITEM_STATUS: Record<JobItemStatus, StatusMeta> = {
  PENDING: { label: 'Pending', tone: 'warning' },
  PROCESSED: { label: 'Processed', tone: 'success' },
  SKIPPED: { label: 'Skipped', tone: 'neutral' },
  FAILED: { label: 'Failed', tone: 'danger' },
};

export const jobItemStatus = (status: JobItemStatus): StatusMeta =>
  JOB_ITEM_STATUS[status] ?? UNKNOWN;

// ── 3. Xero sync-run status ─────────────────────────────────────────────────
export type SyncStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

const SYNC_STATUS: Record<SyncStatus, StatusMeta> = {
  RUNNING: { label: 'Running', tone: 'warning' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
};

export const syncStatus = (status: SyncStatus): StatusMeta => SYNC_STATUS[status] ?? UNKNOWN;

// ── 4. Pre-flight validation status ─────────────────────────────────────────
export type ValidationStatus = 'VALID' | 'WARNING' | 'INVALID' | 'ERROR' | 'PENDING';

const VALIDATION_STATUS: Record<ValidationStatus, StatusMeta> = {
  VALID: { label: 'Valid', tone: 'success' },
  WARNING: { label: 'Warning', tone: 'warning' },
  INVALID: { label: 'Invalid', tone: 'danger' },
  ERROR: { label: 'Error', tone: 'danger' },
  PENDING: { label: 'Not validated', tone: 'neutral' },
};

export const validationStatus = (status: ValidationStatus): StatusMeta =>
  VALIDATION_STATUS[status] ?? UNKNOWN;

// ── 5. Audit action ─────────────────────────────────────────────────────────
// Actions are free-form strings like "JOB_APPROVED", so this matches on the
// verb rather than enumerating every action the backend might ever log.
const AUDIT_ACTION_TONES: ReadonlyArray<readonly [string, Tone]> = [
  ['CREATED', 'success'],
  ['DELETED', 'danger'],
  ['FAILED', 'danger'],
  ['UPDATED', 'warning'],
  ['APPROVED', 'brand'],
];

export function auditActionTone(action: string): Tone {
  const hit = AUDIT_ACTION_TONES.find(([verb]) => action.includes(verb));
  return hit ? hit[1] : 'neutral';
}
