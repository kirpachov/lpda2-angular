import {TuiDateMode, TuiDay, TuiTime, TuiTimeMode} from "@taiga-ui/cdk";
import { getTimezoneOffsetHours } from "./str-time-timezone";
// import { offsetHours } from "./str-time-timezone";

export const isoTimezoneRexExp: RegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

/**
 * Will convert TuiDay and TuiTime to ISO string in UTC.
 */
export function tuiDatetimeToIsoString(day: TuiDay, _time: TuiTime): string {
  const offsetHours: number = getTimezoneOffsetHours();
  const time = (new TuiTime(_time.hours, _time.minutes)).shift({hours: - offsetHours });

  return new Date(Date.UTC(day.year, day.month, day.day, time.hours, time.minutes)).toISOString();
}

/**
 * Reverse of tuiDatetimeToIsoString.
 * @param isoString
 */
export function isoStringToTuiDay(isoString: unknown): TuiDay | null {
  if (isoString == null || isoString == undefined || isoString == "") return null;

  if (!(typeof isoString == 'string' && isoString.length > 0 && isoString.match(isoTimezoneRexExp))) {
    console.error(`Invalid string provided to isoStringToTuiDay`, {isoString});
    return null;
  }

  const date: Date = new Date(isoString);
  return new TuiDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Will accept strings in the following formats:
 * - YYYY-MM-DD
 * - YYYY-MM-DD HH:mm
 *
 * and will return the corresponding TuiDay
 * @param str
 */
export function stringToTuiDay(str: unknown): TuiDay | null {
  if (str == null || str == undefined || str == "") return null;

  if (typeof str == "string" && str.length > 0 && str.match(/^\d{4}-\d{1,2}-\d{1,2}\s{1}\d{1,2}:\d{1,2}$/)) {
    str = str.split(" ")[0];
  }

  if (!(typeof str == 'string' && str.length > 0 && str.match(/^\d{4}-\d{1,2}-\d{1,2}$/))) {
    console.error(`Invalid string provided to stringToTuiDay. Expected format YYYY-MM-DD, got`, {str});
    return null;
  }

  const { day, month, year } = TuiDay.parseRawDateString(str, "YMD");

  return new TuiDay(year, month, day);
}

/**
 * Will accept strings in the following formats:
 * - YYYY-MM-DD
 * - YYYY-MM-DD HH:mm
 *
 * and will return the corresponding TuiTime
 * @param str
 */
export function stringToTuiTime(str: unknown): TuiTime | null {
  if (typeof str == "string" && str.length > 0 && str.match(/^\d{4}-\d{1,2}-\d{1,2}\s{1}\d{1,2}:\d{1,2}$/)) {
    str = str.split(" ")[1];
  }

  if (!(typeof str == 'string' && str.length > 0 && str.match(/^\d{1,2}:\d{1,2}$/))) {
    console.error(`Invalid string provided to stringToTuiDay. Expected format HH:mm, got`, {str});
    return null;
  }

  const [hours, minutes] = str.split(":").map((j: string) => Number(j));
  if (!(typeof hours === "number" && hours >= 0 && hours <= 23)) {
    console.error(`error while parsing time in stringToTuiTime. hours is invalid `, {hours});
    return  null;
  }

  if (!(typeof minutes === "number" && minutes >= 0 && minutes < 60)) {
    console.error(`error while parsing time in stringToTuiTime. minutes are invalid`, {minutes});
    return null;
  }

  return new TuiTime(hours, minutes);
}

/**
 * Reverse of tuiDatetimeToIsoString.
 * @param isoString
 */
export function isoStringToTuiTime(isoString: unknown): TuiTime | null {
  if (!(typeof isoString == 'string' && isoString.length > 0 && isoString.match(isoTimezoneRexExp))) {
    console.error(`Invalid string provided to isoStringToTuiTime`, {isoString});
    return null;
  }

  const date: Date = new Date(isoString);
  return new TuiTime(date.getHours(), date.getMinutes());
}

/**
 * Will convert TuiDay to string in format 'YYYY-MM-DD'.
 * @param day
 */
export function tuiDayToString(day: TuiDay): string {
  return `${day.formattedYear}-${day.formattedMonthPart}-${day.formattedDayPart}`;
}

/**
 * Will convert TuiTime to string.
 * @param time - TuiTime object.
 * @param mode - format of time. Default 'HH:MM'.
 */
// export function tuiTimeToString(time: TuiTime, mode: TuiTimeMode = "HH:MM"): string {
//   return time.toString(mode);
// }

export function tuiTimeToIsoString(time: TuiTime): string {
  return new Date(`1970-01-01 ${time.toString()}`).toISOString();
}

/**
 * Given a string like 'HH:MM' will return a string in format 'HH:MM'.
 * @param time
 *
 * Example:
 * When in Rome, input '10:00' will return '9:00'.
 */
export function fromTocalToUtcTimeString(time: string): string {
  const date = new Date(`1970-01-01 ${time}`);
  const hours = `${date.getUTCHours()}`.padStart(2, '0');
  const minutes = `${date.getUTCMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * @param timeUtc string in format 'HH:MM', UTC time
 * @returns string in format 'HH:MM', local time
 */
export function fromUtcTimeToLocal(timeUtc: string): string {
  // Split the input string into hours and minutes
  const [hours, minutes] = timeUtc.split(":").map(Number);

  // Create a Date object using the UTC time
  const utcDate = new Date();
  utcDate.setUTCHours(hours, minutes, 0, 0);

  // Convert the UTC date to local time
  const localHours = utcDate.getHours();
  const localMinutes = utcDate.getMinutes();

  // Format the local time as "HH:MM"
  const formattedHours = localHours.toString().padStart(2, "0");
  const formattedMinutes = localMinutes.toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}`;
}


/**
 * Given UTC datetime string in format 'YYYY-MM-DD HH:MM' will localize it to the user's timezone.
 */
export function fromUtcTimeDateToLocal(time: string): string {
  const utcDate = new Date(`${time}Z`); // Interpreta la stringa come UTC
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getDate()).padStart(2, '0');
  const hours = String(utcDate.getHours()).padStart(2, '0');
  const minutes = String(utcDate.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function tuiTimeToUTCString(time: TuiTime): string {
  const offsetHours: number = getTimezoneOffsetHours();
  const shiftedTime = (new TuiTime(time.hours, time.minutes)).shift({hours: - offsetHours });

  const hours = `${shiftedTime.hours}`.padStart(2, '0');
  const minutes = `${shiftedTime.minutes}`.padStart(2, '0');

  console.log(`input: ${time.toString()}, shifted: ${hours}:${minutes}`);

  return `${hours}:${minutes}`;
}

export function dateToTuiDay(date: Date): TuiDay {
  return new TuiDay(date.getFullYear(), date.getMonth() /* + 1 */, date.getDate());
}

export function dateToTuiTime(date: Date): TuiTime {
  return new TuiTime(date.getHours(), date.getMinutes());
}
