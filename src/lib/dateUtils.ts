// Utility constants and functions for date handling

export const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthIndex(month: string): number {
  return MONTH_ORDER.indexOf(month);
}

export function getMonthName(monthIndex: number): string | undefined {
  return MONTH_ORDER[monthIndex];
}

export function getNextMonth(month: string): { month: string; yearOffset: number } {
  const idx = monthIndex(month);
  if (idx === -1) return { month, yearOffset: 0 };
  if (idx === 11) return { month: 'Jan', yearOffset: 1 };
  return { month: MONTH_ORDER[idx + 1], yearOffset: 0 };
}

export function getPreviousMonth(month: string): { month: string; yearOffset: number } {
  const idx = monthIndex(month);
  if (idx === -1) return { month, yearOffset: 0 };
  if (idx === 0) return { month: 'Dec', yearOffset: -1 };
  return { month: MONTH_ORDER[idx - 1], yearOffset: 0 };
}
