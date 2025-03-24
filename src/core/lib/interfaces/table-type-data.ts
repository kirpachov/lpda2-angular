import { BaseModelData } from "./base-model-data";
import { ImageData } from '@core/lib/interfaces/image-data';

export const TableTypeStatuses = ["active", "inactive"] as const;
export type TableTypeStatus = typeof TableTypeStatuses[number];

export interface TableTypeData extends BaseModelData {
  name?: string;
  description?: string;
  default_people_per_turn?: number;
  default_price?: number; // per person
  notes?: string;
  status?: TableTypeStatus;

  translations?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  }

  images?: ImageData[];
}