import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, inject, Input, OnInit, Output, signal, WritableSignal } from '@angular/core';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { TermsAndConditionsLinkComponent } from '@core/components/terms-and-conditions-link/terms-and-conditions-link.component';
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';
import { TableType } from '@core/models/table-type';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { takeUntil } from 'rxjs';
import { PublicShowImagesComponent } from "../../public-show-images/public-show-images.component";
import { TuiCheckboxBlockModule } from '@taiga-ui/kit';
import { TableTypeData } from '@core/lib/interfaces/table-type-data';
import { CurrencyPipe } from '@angular/common';
import { LinkifyPipe } from "../../../pipes/linkify.pipe";
import { TuiButtonModule } from '@taiga-ui/core';
import { TableTypeToPreorderReservationGroup } from '@core/lib/interfaces/table-type-to-preorder-reservation-group';
import { PublicReserve2 } from '../public-reservation-formv2/public-reservation-formv2.component';
import { ShowMessagesComponent } from "../show-messages/show-messages.component";

@Component({
  selector: 'app-public-reserve-ask-table-type',
  standalone: true,
  imports: [
    PublicShowImagesComponent,
    TuiCheckboxBlockModule,
    FormsModule,
    CurrencyPipe,
    LinkifyPipe,
    TuiButtonModule,
    ShowMessagesComponent
],
  templateUrl: './public-reserve-ask-table-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PublicReserveAskTableTypeComponent),
      multi: true,
    }
  ],
})
export class PublicReserveAskTableTypeComponent implements OnInit, ControlValueAccessor {


  @Output() submitted: EventEmitter<TableTypeData | null> = new EventEmitter<TableTypeData | null>();
  @Input() showLoader: boolean = false;

  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);

  readonly control: FormControl<TableTypeData | null> = new FormControl<TableTypeData | null>(null);

  readonly tableTypes: WritableSignal<TableTypeToPreorderReservationGroup[]> = signal([]);
  readonly message: WritableSignal<string | null> = signal(null);

  @Input({ required: true }) set group(value: PreorderReservationGroup) {
    this.tableTypes.set(value?.table_type_to_preorder_reservation_groups || []);
    this.message.set(value?.message || null);
  }

  ngOnInit(): void {
    // throw new Error('Method not implemented.');
  }

  writeValue(obj: any): void {
    this.control.setValue(obj);
  }

  registerOnChange(fn: any): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe((v) => fn(v))
  }

  registerOnTouched(fn: any): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe((v) => fn(v))
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

  updateTableTypeId(id: number | null | undefined) {
    const tableType: TableTypeData | null = this.tableTypes().find((v) => v.table_type_id === id)?.table_type || null;

    this.updateTableType(tableType);
  }

  updateTableType(arg0: TableTypeData | null | undefined) {
    this.control.setValue(arg0 || null);
  }

  formSubmit(): void {
    const tableType: TableTypeData | null = this.control.value;
    this.submitted.emit(tableType);
  }
}

