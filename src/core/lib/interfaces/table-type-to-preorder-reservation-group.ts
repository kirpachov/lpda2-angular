import { BaseModelData } from "./base-model-data";

export interface TableTypeToPreorderReservationGroup extends BaseModelData {
  table_type_id: string;
  preorder_reservation_group_id: string;
  price: number; // per person
  people_per_turn: number;
}