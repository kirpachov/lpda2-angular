import {BaseModelData} from "@core/lib/interfaces/base-model-data";

export interface MenuVisibilityData extends BaseModelData {
  public_visible?: boolean;

  public_from?: string;
  public_to?: string;

  daily_from?: string;
  daily_to?: string;

  private_visible?: boolean;
}