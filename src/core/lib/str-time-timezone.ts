export const timezoneOffset: number = ((new Date()).getTimezoneOffset() / 60);
// export const offsetHours: number = 1;

/**
 * Ottiene dinamicamente l'offset dal fuso orario corrente del browser
 * Nota: getTimezoneOffset() restituisce i minuti in negativo,
 * quindi neghiamo il risultato per ottenere l'offset corretto
 */
export function getTimezoneOffsetHours(): number {
  return -(new Date()).getTimezoneOffset() / 60;
}

/**
 * Given a string like "HH:mm" in UTC,
 * will convert in current timezone string
 */
export function strTimeTimezone(string: unknown, offset?: number): string {
  if (!(typeof string == 'string' && string.length > 0 && string.match(/\d{1,2}:\d{1,2}/))) {
    console.error(`Invalid string provided to strTimeTimezone`, {string});
    return ``;
  }

  const actualOffset = offset ?? getTimezoneOffsetHours();
  const startsAtHours: number = Number(string.split(`:`)[0]);
  const hours: number = startsAtHours + actualOffset;
  const out  = `${hours < 10 ? '0' : ''}${hours}:${string.split(`:`)[1]}`;
  return out;
}

/**
 * From current timezone to UTC (reverse of strTimeTimezone)
 * format input and output: "HH:mm"
 */
export function strToUTC(string: string, offset?: number): string {
  const actualOffset = offset ?? getTimezoneOffsetHours();
  return strTimeTimezone(string, -1 * actualOffset);
}
