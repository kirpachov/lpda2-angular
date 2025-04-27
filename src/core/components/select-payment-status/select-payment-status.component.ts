import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { ReservationPaymentStatus, ReservationPaymentStatusOptions } from '@core/lib/interfaces/reservation-payment-data';
import { TuiDataListModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TuiDataListWrapperModule, TuiInputModule, TuiSelectModule } from '@taiga-ui/kit';
import { PaymentStatusComponent } from "../payment-status/payment-status.component";

@Component({
  selector: 'app-select-payment-status',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiSelectModule,
    TuiInputModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiTextfieldControllerModule,
    PaymentStatusComponent
],
  templateUrl: './select-payment-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectPaymentStatusComponent,
      multi: true
    }
  ]
})
export class SelectPaymentStatusComponent implements ControlValueAccessor {
  readonly control: FormControl = new FormControl(null);

  readonly ReservationPaymentStatusOptions: ReservationPaymentStatus[] = [...ReservationPaymentStatusOptions];

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
