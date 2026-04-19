import {BaseModel} from "@core/lib/base-model";
import {ReservationTurnData} from "@core/lib/interfaces/reservation-turn-data";
import {strTimeTimezone} from "@core/lib/str-time-timezone";
import { PreorderReservationGroup } from "./preorder-reservation-group";
import { ReservationTurnMessage } from "@core/models/reservation-turn-message";

export class ReservationTurn extends BaseModel {
  starts_at?: string; // Something like "HH:mm"
  ends_at?: string; // Something like "HH:mm"
  name?: string;
  weekday?: 0|1|2|3|4|5|6; // 0 to 6 where 0 is sunday
  step?: number;

  valid_times?: string[];

  preorder_reservation_group?: PreorderReservationGroup;

  messages?: ReservationTurnMessage[] = [];

  constructor(data: ReservationTurnData) {
    super(data);

    // this.starts_at = data.starts_at;
    // this.ends_at = data.ends_at;
    this.name = data.name;
    this.weekday = data.weekday;
    this.step = data.step;

    this.valid_times = data.valid_times;

    this.starts_at = data.starts_at ? strTimeTimezone(data.starts_at) : undefined;

    this.ends_at = data.ends_at ? strTimeTimezone(data.ends_at) : undefined;

    this.preorder_reservation_group = data.preorder_reservation_group ? new PreorderReservationGroup(data.preorder_reservation_group) : undefined;

    this.messages = data.messages;
  }
}
