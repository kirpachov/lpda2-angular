import {ReservationTurnData} from "@core/lib/interfaces/reservation-turn-data";

export interface ReservationTableSummary {
  turn: ReservationTurnData;
  summary: Record<number, number>;
}

export type UngroupedTablesSummary = Record<number, number>;

/**
 * Adjusting data received from server by adding missing table sizes.
 * This is necessary because server does not return tables with 0 reservations.
 * Plus, we need to merge different summaries and make sure the all have the same table sizes, so we can display them in a table.
 * Note: updating original object.
 */
export function addMissingTableSizes(summary: ReservationTableSummary, sizes: number[]): ReservationTableSummary {
  const min: number = 8;

  for (let i = 1; i <= min; i++) {
    if (!(i in summary.summary)) {
      summary.summary[i] = 0;
    }
  }
 
  for (const size of sizes) {
    if (!(size in summary.summary)) {
      summary.summary[size] = 0;
    }
  }

  return summary;
}

/**
 * Adjusting data received from server: making sure all the summaries have the same table sizes and at least 8 table sizes.
 * Note: updating provided object.
 */
export function adjustSummaries(summaries: ReservationTableSummary[]): ReservationTableSummary[] {
  const sizes: number[] = (summaries.map(summary => Object.keys(summary.summary).map(Number))).flat();
  return summaries.map(summary => addMissingTableSizes(summary, sizes));
}