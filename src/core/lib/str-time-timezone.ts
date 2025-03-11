export const timezoneOffset: number = ((new Date()).getTimezoneOffset() / 60);
export const offsetHours: number = 1;

/**
 * Given a string like
 * "HH:mm" in UTC,
 * will convert in current timezone string
 */
export function strTimeTimezone(string: unknown, offset: number = offsetHours): string {
  if (!(typeof string == 'string' && string.length > 0 && string.match(/\d{1,2}:\d{1,2}/))) {
    console.error(`Invalid string provided to strTimeTimezone`, {string});
    return ``;
  }

  const startsAtHours: number = Number(string.split(`:`)[0]);
  const hours: number = startsAtHours + offset;
  const out  = `${hours < 10 ? '0' : ''}${hours}:${string.split(`:`)[1]}`;
  return out;
}

/**
 * From current timezone to UTC (reverse of strTimeTimezone)
 * format input and output: "HH:mm"
 */
export function strToUTC(string: string, offset: number = offsetHours): string {
  return strTimeTimezone(string, -1 * offset);
}