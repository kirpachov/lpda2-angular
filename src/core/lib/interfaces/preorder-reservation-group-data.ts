import { BaseModelData } from "./base-model-data";
import { PreorderReservationDateData } from "./preorder-reservation-date-data";
import { ReservationTurnData } from "./reservation-turn-data";
import { TableTypeToPreorderReservationGroup } from "./table-type-to-preorder-reservation-group";

export interface PreorderReservationGroupData extends BaseModelData {
  title?: string;
  status?: PreorderReservationGroupStatus;
  // active_from?: string;
  // active_to?: string;
  preorder_type?: PreorderType;
  payment_value?: number;

  // Translated message: {language: message}
  message?: string;

  translations: {
    message?: Record<string, string>;
  }

  turns: ReservationTurnData[];
  dates: PreorderReservationDateData[];
  table_type_to_preorder_reservation_groups?: TableTypeToPreorderReservationGroup[];
}

export const PreorderReservationGroupStatuses = ["active", "inactive"] as const;
export type PreorderReservationGroupStatus = typeof PreorderReservationGroupStatuses[number];

export const PreorderTypes = ["nexi_payment", "nexi_authorization"] as const;
export type PreorderType = typeof PreorderTypes[number];
export function isPreorderType(value: unknown): value is PreorderType {
  return PreorderTypes.includes(value as PreorderType);
}