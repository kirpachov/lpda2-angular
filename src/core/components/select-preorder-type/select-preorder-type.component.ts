import { ChangeDetectionStrategy, Component, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { isPreorderType, PreorderType, PreorderTypes } from '@core/lib/interfaces/preorder-reservation-group-data';
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiDataListModule, TuiHostedDropdownComponent, TuiHostedDropdownModule } from '@taiga-ui/core';
import { distinctUntilChanged, takeUntil } from 'rxjs';
import { PreorderReservationGroupPreorderTypeComponent } from "../preorder-reservation-group-preorder-type/preorder-reservation-group-preorder-type.component";
import { NgFor } from '@angular/common';
import { TuiDataListWrapperModule, TuiSelectModule } from '@taiga-ui/kit';

@Component({
  selector: 'app-select-preorder-type',
  standalone: true,
  imports: [
    TuiSelectModule,
    PreorderReservationGroupPreorderTypeComponent,
    ReactiveFormsModule,
    TuiDataListWrapperModule,
  ],
  templateUrl: './select-preorder-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectPreorderTypeComponent),
      multi: true,
    }
  ],
})
export class SelectPreorderTypeComponent implements ControlValueAccessor {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  readonly control: FormControl<PreorderReservationGroup["preorder_type"] | null> = new FormControl<PreorderReservationGroup["preorder_type"] | null>(null);

  readonly form = new FormGroup({
    control: this.control,
  });

  readonly options: PreorderType[] = [...PreorderTypes];

  writeValue(value: PreorderReservationGroup["preorder_type"] | undefined | null): void {
    if (value && !isPreorderType(value)) {
      console.error('Invalid preorder type:', value);
      value = null;
    }

    this.control.setValue(value || null);
  };

  registerOnChange(fn: any): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(),
    ).subscribe({ next: (v) => fn(v) });
  }

  registerOnTouched(fn: any): void {
    this.registerOnChange(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }
}
