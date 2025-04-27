import { ChangeDetectionStrategy, Component, inject, OnChanges, OnInit, signal, WritableSignal } from '@angular/core';
import { ControlValueAccessor, FormArray, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TuiButtonModule, TuiPrimitiveTextfieldModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TuiInputModule } from '@taiga-ui/kit';
import { TableTypeSelectComponent } from "../dynamic-selects/table-type-select/table-type-select.component";
import { TableType } from '@core/models/table-type';
import { TableTypesService } from '@core/services/http/table-types.service';
import { SearchResult } from '@core/lib/search-result.model';
import { ShowImagesComponent } from "../show-images/show-images.component";
import { ShowImageComponent } from "../show-image/show-image.component";
import { ErrorsComponent } from "../errors/errors.component";
import { TuiDestroyService } from '@taiga-ui/cdk';

@Component({
  selector: 'app-table-type-to-preorder-reservation-group-input',
  standalone: true,
  imports: [
    TuiButtonModule,
    ReactiveFormsModule,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiPrimitiveTextfieldModule,
    TableTypeSelectComponent,
    ShowImagesComponent,
    ShowImageComponent,
    ErrorsComponent
  ],
  templateUrl: './table-type-to-preorder-reservation-group-input.component.html',
  providers: [
    TuiDestroyService,

    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: TableTypeToPreorderReservationGroupInputComponent,
      multi: true
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableTypeToPreorderReservationGroupInputComponent implements OnInit, ControlValueAccessor {
  /**
   * Output will have this format:
   * [
   *   {
   *     table_type_id: number,
   *     price: number,
   *     people_per_turn: number,
   *   }
   * ]
   */

  readonly addTable: FormControl<TableType | null> = new FormControl<TableType | null>(null);

  readonly forms = new FormArray<FormGroup<{ table_type_id: FormControl<number | null>, price: FormControl<number | null>, people_per_turn: FormControl<number | null> }>>([]);

  readonly tableTypeByIds: WritableSignal<Record<number, TableType>> = signal({});

  private readonly tableTypes: TableTypesService = inject(TableTypesService);

  ngOnInit(): void {
    this.tableTypes.search({ per_page: 1000 }).subscribe((data: SearchResult<TableType>) => {
      const tableTypeByIds: Record<number, TableType> = {};

      data.items.forEach((tableType: TableType) => {
        if (tableType.id) tableTypeByIds[tableType.id] = tableType;
      });

      this.tableTypeByIds.set(tableTypeByIds);
    });

    this.addTable.valueChanges.subscribe((table: TableType | null) => {
      if (table && table.id) {
        this.addRow({ table_type_id: table.id, price: table.default_price, people_per_turn: table.default_people_per_turn });
  
        this.addTable.reset();
      }
    });
  }

  writeValue(obj: unknown): void {
    this.forms.clear();

    if (!obj) return;

    if (!Array.isArray(obj)) return;

    obj.forEach((item: { table_type_id: number; price: number; people_per_turn: number }) => {
      this.addRow(item);
      // this.forms.push(new FormGroup({
      //   table_type_id: new FormControl(item.table_type_id),
      //   price: new FormControl(item.price),
      //   people_per_turn: new FormControl(item.people_per_turn),
      // }));
    });
  }

  registerOnChange(fn: any): void {
    this.forms.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.forms.valueChanges.subscribe(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.forms.disable();
    } else {
      this.forms.enable();
    }
  }

  removeAt(index: number): void {
    this.forms.removeAt(index);
  }

  private addRow(data: { table_type_id: number, price?: number | null, people_per_turn?: number | null }): void {
    this.forms.push(new FormGroup({
      table_type_id: new FormControl(data.table_type_id),
      price: new FormControl(data.price || 0),
      people_per_turn: new FormControl(data.people_per_turn || 0),
    }));
  }
}
