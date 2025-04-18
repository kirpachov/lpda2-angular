import { BaseModelData } from "./base-model-data";

export interface ReservationPaymentData extends BaseModelData {
  hpp_url?: string;
  value?: number;
  status?: ReservationPaymentStatus;
  reservation_id?: number;
  preorder_type?: ReservationPaymentPreorderType;
  external_id?: string;
  other?: Record<string, unknown>;
}

export const ReservationPaymentStatusOptions = ["todo", "authorized", "paid", "refunded"] as const;
export type ReservationPaymentStatus = typeof ReservationPaymentStatusOptions[number];

export const ReservationPaymentPreorderTypeOptions = ["html_nexi_payment", "html_nexi_authorization"] as const;
export type ReservationPaymentPreorderType = typeof ReservationPaymentPreorderTypeOptions[number];