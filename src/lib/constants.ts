/** Domain constants for the INSPIRE Colloquium */

/** Asia/Kolkata timezone used for all date computations */
export const TIMEZONE = 'Asia/Kolkata';

/** Maximum selected teams/individuals per category */
export const CAPACITY = {
  UG: 60,
  PG: 25,
  PHD: 25,
  PPG: 25,
} as const;

export const DEFAULT_PAGE_SIZE = 50;
