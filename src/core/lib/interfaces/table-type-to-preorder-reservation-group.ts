import { BaseModelData } from "./base-model-data";
import { PreorderReservationGroupData } from "./preorder-reservation-group-data";
import { TableTypeData } from "./table-type-data";

export interface TableTypeToPreorderReservationGroup extends BaseModelData {
  table_type_id: number;
  preorder_reservation_group_id: number;
  price: number; // per person
  people_per_turn: number;

  preorder_reservation_group?: PreorderReservationGroupData;
  table_type?: TableTypeData;
}