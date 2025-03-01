import {BaseModelData} from "@core/lib/interfaces/base-model-data";
import {MenuVisibilityData} from "@core/lib/interfaces/menu-visibility-data";
import { ImageData } from '@core/lib/interfaces/image-data';
import { DishStatus } from "./dish-data";

export interface MenuCategoryData extends BaseModelData {
  name?: string;
  description?: string;
  status?: MenuCategoryStatus;
  price?: number;
  parent_id?: number;
  index?: number;
  secret?: string;
  secret_desc?: string;
  visibility_id?: number;

  // Server-side calculated value if the category is between the public visible ones.
  public_visible?: boolean;

  visibility?: MenuVisibilityData;
  parent?: MenuCategoryData;
  children?: MenuCategoryData[];

  images?: ImageData[];

  translations?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  }

  stats?: {
    dishes: Partial<Record<DishStatus, number>>;
    children: Partial<Record<MenuCategoryStatus, number>>;
  }
}

export const MenuCategoryStatuses = [`active`, `inactive`, `deleted`] as const;
export type MenuCategoryStatus = typeof MenuCategoryStatuses[number];