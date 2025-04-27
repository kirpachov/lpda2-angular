import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule, NG_VALUE_ACCESSOR, FormControl, ControlValueAccessor } from '@angular/forms';
import { ReservationPaymentPreorderType, ReservationPaymentPreorderTypeOptions, ReservationPaymentStatus, ReservationPaymentStatusOptions } from '@core/lib/interfaces/reservation-payment-data';
import { TuiDataListModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TuiSelectModule, TuiInputModule, TuiDataListWrapperModule } from '@taiga-ui/kit';
import { PaymentStatusComponent } from '../payment-status/payment-status.component';
import { ReservationPaymentPreorderTypeComponent } from "../reservation-payment-preorder-type/reservation-payment-preorder-type.component";

@Component({
  selector: 'app-select-reservation-payment-preorder-type',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiSelectModule,
    TuiInputModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiTextfieldControllerModule,
    ReservationPaymentPreorderTypeComponent
],
  templateUrl: './select-reservation-payment-preorder-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectReservationPaymentPreorderTypeComponent,
      multi: true
    }
  ]
})
export class SelectReservationPaymentPreorderTypeComponent implements ControlValueAccessor {
  readonly ReservationPaymentPreorderTypeOptions: ReservationPaymentPreorderType[] = [...ReservationPaymentPreorderTypeOptions];

  readonly control: FormControl = new FormControl(null);

  writeValue(obj: any): void {
    this.control.setValue(obj);
  }

  registerOnChange(fn: any): void {
    this.control.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.control.valueChanges.subscribe(fn);
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

}

