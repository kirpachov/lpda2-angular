import { fromUtcTimeDateToLocal } from "../tui-datetime-to-iso-string";

export interface StatsParams {
  reservations_date_from?: string;
  reservations_date_to?: string;
  keys?: StatsKeys | StatsKeys[];
}

export const StatsKeys = [
  "reservations-by-hour",
  "reservations-count"
] as const;

export type StatsKeys = typeof StatsKeys[number];

/**
 * /v1/admin/stats returns response of this kind:
 */
export interface Stats {
  /**
   * Key is the UCT datetime string in the format of `YYYY-MM-DD HH:mm`.
   * Value is the sum of the people that made a reservation in that hour.
   */
  ["reservations-by-hour"]: Record<string, number>;

  /**
   * Number of reservations grouped by :datetime (when ppl come to eat)
   */
  ["reservations-count"]: {
    count_by_month: Record<string, number>,
    // {
    //   "2023-01": 2,
    //   "2021-01": 3,
    //   "2021-05": 1,
    //   "2025-03": 21,
    //   "2025-05": 11
    // },

    count_by_year: Record<string, number>,
    // count_by_year: {
    //   "2025": 21 + 11,
    //   "2023": 2,
    //   "2021": 4
    // },

    count_by_day_current_month: Record<string, number>,
    // count_by_day_current_month: {
    //   "2025-03-08": 3,
    //   "2025-03-09": 5,
    //   "2025-03-14": 2,
    //   "2025-03-15": 4,
    //   "2025-03-16": 3,
    //   "2025-03-17": 4
    // },

    count_by_day_current_week: Record<string, number>,
    // count_by_day_current_week: {
    //   "2025-03-14": 2,
    //   "2025-03-15": 4
    // },


    current: {
      day: number,
      week: number,
      month: number,
      year: number
    },
    // current: {
    //   day: 4,
    //   week: 6,
    //   month: 21,
    //   year: 21 + 11
    // }
  },


  /**
   * Number of reservations grouped by :created_at
   */
  ["reservations-creation"]: {
    count_by_month: Record<string, number>,
    // {
    //   "2023-01": 2,
    //   "2021-01": 3,
    //   "2021-05": 1,
    //   "2025-03": 21,
    //   "2025-05": 11
    // },

    count_by_year: Record<string, number>,
    // count_by_year: {
    //   "2025": 21 + 11,
    //   "2023": 2,
    //   "2021": 4
    // },

    count_by_day_current_month: Record<string, number>,
    // count_by_day_current_month: {
    //   "2025-03-08": 3,
    //   "2025-03-09": 5,
    //   "2025-03-14": 2,
    //   "2025-03-15": 4,
    //   "2025-03-16": 3,
    //   "2025-03-17": 4
    // },

    count_by_day_current_week: Record<string, number>,
    // count_by_day_current_week: {
    //   "2025-03-14": 2,
    //   "2025-03-15": 4
    // },


    current: {
      day: number,
      week: number,
      month: number,
      year: number
    },
    // current: {
    //   day: 4,
    //   week: 6,
    //   month: 21,
    //   year: 21 + 11
    // }
  }
}

export function isStatsReservationsByHour(arg: unknown): arg is Stats["reservations-by-hour"] {
  return (
    typeof arg === 'object' && arg !== null &&
    Object.keys(arg).every((key) => typeof key === 'string' && typeof (arg as Record<string, unknown>)[key] === 'number')
  )
}

export function isStats(arg: unknown): arg is Stats {
  return (
    typeof arg === 'object' && arg !== null &&
    isStatsReservationsByHour((arg as Record<string, unknown>)["reservations-by-hour"])
  )
}

/**
 * Whenever founds dates or times, will localize them to the user's locale.
 */
export function localizeStats(stats: Partial<Stats>): Partial<Stats> {
  const localizedStats: Partial<Stats> = {...stats};

  if (localizedStats["reservations-by-hour"] && stats["reservations-by-hour"]) {
    localizedStats["reservations-by-hour"] = {};
    for (const [key, value] of Object.entries(stats["reservations-by-hour"])) {
      localizedStats["reservations-by-hour"][fromUtcTimeDateToLocal(key)] = value;
    }
  }

  return localizedStats;
}
