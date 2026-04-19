import {ReservationData, ReservationStatus} from "@core/lib/interfaces/reservation-data";
import {BaseModel} from "@core/lib/base-model";
import {DeliveredEmail} from "@core/models/delivered-email";
import {DeliveredEmailData} from "@core/lib/interfaces/delivered-email-data";
import { ReservationPayment } from "./reservation-payment";
import { TableType } from "./table-type";

export class Reservation extends BaseModel {
  fullname?: string;
  datetime?: Date;
  status?: ReservationStatus;
  secret?: string;
  adults?: number;
  children?: number;
  table?: string;
  notes?: string;
  email?: string;
  phone?: string;
  payment?: ReservationPayment;

  cancelled_at?: Date;

  delivered_emails?: DeliveredEmail[];

  table_type_id?: number;
  table_type?: TableType;

  get people(): number {
    return (this.adults || 0) + (this.children || 0);
  }

  constructor(data: ReservationData) {
    super(data);

    this.fullname = data.fullname;
    const datetime = data.datetime ? new Date(data.datetime) : undefined;
    this.datetime = datetime;
    this.cancelled_at = data.cancelled_at ? new Date(data.cancelled_at) : undefined;
    this.status = data.status;
    this.secret = data.secret;
    this.adults = data.adults;
    this.children = data.children;
    this.table = data.table;
    this.notes = data.notes;
    this.email = data.email;
    this.phone = data.phone;
    this.payment = data.payment ? new ReservationPayment(data.payment) : undefined;

    this.delivered_emails = data.delivered_emails ? data.delivered_emails.map((data: DeliveredEmailData) => new DeliveredEmail(data)) : [];
    this.table_type_id = data.table_type_id;
    this.table_type = data.table_type ? new TableType(data.table_type) : undefined;
  }
}
