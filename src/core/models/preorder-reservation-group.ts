import { BaseModel } from "@core/lib/base-model"
import { PreorderReservationGroupData, PreorderReservationGroupStatus, PreorderType } from "@core/lib/interfaces/preorder-reservation-group-data";
import { ReservationTurn } from "./reservation-turn";
import { PreorderReservationDate } from "./preorder-reservation-date";
import { ReservationTurnData } from "@core/lib/interfaces/reservation-turn-data";
import { PreorderReservationDateData } from "@core/lib/interfaces/preorder-reservation-date-data";
import { TableTypeToPreorderReservationGroup } from "@core/lib/interfaces/table-type-to-preorder-reservation-group";

export class PreorderReservationGroup extends BaseModel {
  title?: string;
  status?: PreorderReservationGroupStatus;
  // active_from?: Date;
  // active_to?: Date;
  preorder_type?: PreorderType;
  payment_value?: number;

  // Translated message: {language: message}
  message?: string;

  translations: {
    message?: Record<string, string>;
  }

  turns: ReservationTurn[] = [];
  dates: PreorderReservationDate[] = [];

  table_type_to_preorder_reservation_groups?: TableTypeToPreorderReservationGroup[];

  constructor(data: PreorderReservationGroupData) {
    super(data);

    this.title = data.title;
    this.status = data.status;
    // this.active_from = data.active_from ? new Date(data.active_from) : undefined;
    // this.active_to = data.active_to ? new Date(data.active_to) : undefined;
    this.preorder_type = data.preorder_type;
    this.payment_value = data.payment_value;
    this.message = data.message;

    this.turns = (data.turns || []).map((datum: ReservationTurnData) => new ReservationTurn(datum));
    this.dates = (data.dates || []).map((datum: PreorderReservationDateData) => new PreorderReservationDate(datum));
    this.translations = data.translations || {};

    this.table_type_to_preorder_reservation_groups = data.table_type_to_preorder_reservation_groups;
  }
}