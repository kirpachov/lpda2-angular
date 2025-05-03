import { NgClass } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TuiDestroyService, TuiTime } from '@taiga-ui/cdk';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-time-input',
  standalone: true,
  imports: [
    NgClass,
  ],
  templateUrl: './time-input.component.html',
  providers: [
    TuiDestroyService,

    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: TimeInputComponent,
      multi: true,
    }
  ]
})
export class TimeInputComponent implements ControlValueAccessor {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);

  @Input({ required: true }) options: readonly TuiTime[] = [];

  readonly time: FormControl<TuiTime | null> = new FormControl<TuiTime | null>(null);

  writeValue(obj: any): void {
    this.time.setValue(obj);
  }

  registerOnChange(fn: any): void {
    this.time.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe((value: TuiTime | null) => {
      fn(value);
    });
  }

  registerOnTouched(fn: any): void {
    this.time.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe((value: TuiTime | null) => {
      fn(value);
    });
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.time.disable();
    } else {
      this.time.enable();
    }
  }

  onTimeClick(time: TuiTime) {
    this.time.setValue(time);
  }
}
