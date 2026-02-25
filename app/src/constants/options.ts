/** Static options for dropdowns; not mock data. */

export const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

export const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

/** Bank accounts come from API when available; empty until then. */
export const bankAccounts: { id: string; name: string; code: string; currency: string }[] = [];
