import { JOB_TYPE, type JobType } from '@/types';

/** Query-string key used to preselect a job type on the builder page. */
export const JOB_TYPE_PARAM = 'type';

/** Path to the job builder, optionally preselecting a job type. */
export const jobBuilderPath = (jobType?: JobType): string =>
  jobType ? `/jobs/new?${JOB_TYPE_PARAM}=${jobType}` : '/jobs/new';

/** Narrow an arbitrary string (e.g. from the URL) to a valid JobType, or null. */
export const parseJobType = (value: string | null): JobType | null =>
  (Object.values(JOB_TYPE) as string[]).includes(value ?? '') ? (value as JobType) : null;
