import { BaseModel } from "@core/lib/base-model";
import { TableTypeData, TableTypeStatus } from "@core/lib/interfaces/table-type-data";
import {Image} from "@core/models/image";
import { ImageData } from '@core/lib/interfaces/image-data';

export class TableType extends BaseModel {
  name?: string;
  description?: string;
  default_people_per_turn?: number;
  default_price?: number;
  notes?: string;
  status?: TableTypeStatus;

  translations?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  }

  images?: Image[];

  constructor(data: TableTypeData) {
    super(data);

    this.name = data.name;
    this.description = data.description;
    this.default_people_per_turn = data.default_people_per_turn;
    this.default_price = data.default_price;
    this.notes = data.notes;
    this.status = data.status;
    this.translations = data.translations;
    this.images = data.images ? data.images.map((value: ImageData): Image => new Image(value)) : [];
  }
}