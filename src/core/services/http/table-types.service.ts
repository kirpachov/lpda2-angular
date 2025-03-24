import { Injectable } from '@angular/core';
import {CommonHttpService} from "./common-http.service";
import { TableType } from '@core/models/table-type';

@Injectable({
  providedIn: 'root'
})
export class TableTypesService extends CommonHttpService<TableType> {
  constructor() {
    super(TableType, `admin/table_types`);
  }
}
