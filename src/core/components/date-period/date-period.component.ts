import { JsonPipe } from '@angular/common';
import { Component, Input, OnDestroy, Optional, Self, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule } from '@angular/forms';
import { DatePeriodSummaryPipe } from '@core/pipes/date-period-summary.pipe';
import { TuiDay, TuiDayRange, TuiDestroyService } from '@taiga-ui/cdk';
import { TuiDayRangePeriod, TuiInputDateRangeModule, TuiRangeModule } from '@taiga-ui/kit';
import { Observable, map, takeUntil } from 'rxjs';

@Component({
  selector: 'app-date-period',
  templateUrl: './date-period.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePeriodComponent),
      multi: true
    },

    TuiDestroyService,
  ],
  standalone: true,
  imports: [
    TuiInputDateRangeModule,
    // TuiRangeModule,
    ReactiveFormsModule,
    DatePeriodSummaryPipe,
  ]
})
export class DatePeriodComponent implements ControlValueAccessor {
  private readonly destroy$ = inject(TuiDestroyService);

  readonly control = new FormControl<TuiDayRange | null>(null);

  readonly today = TuiDay.currentLocal();

  readonly tomorrow = TuiDay.currentLocal().append({ day: 1 });

  @Input() max: TuiDay | null = null;

  readonly appProductionDate: TuiDay = TuiDay.fromLocalNativeDate(new Date('2023-8-1'));

  readonly endOfCurrentYear: TuiDay = TuiDay.fromLocalNativeDate(new Date(`${this.today.year}-12-31`));

  readonly periodOptions = [
    new TuiDayRangePeriod(new TuiDayRange(this.today.append({ day: -30 }), this.today), $localize`Ultimo mese`),
    new TuiDayRangePeriod(new TuiDayRange(this.today.append({ day: -365 }), this.today), $localize`Ultimo anno`),

    /**
     * Generating last 5 years range options.
     * Each year will start from 1st January and end on 31st December.
     * Exclude years before app production date.
     */
    ...Array.from({ length: 5 }, (_, i) => i).map((i: number) => this.today.year - i).filter((i) => i >= this.appProductionDate.year).map(
      (year: number) => new TuiDayRangePeriod(
        new TuiDayRange(
          TuiDay.fromLocalNativeDate(new Date(`${year}-01-01`)),
          TuiDay.fromLocalNativeDate(new Date(`${year}-12-31`)),
        ), `${year}`)
    ),
  ];

  @Input() label: string = $localize`Seleziona il periodo temporale`;

  writeValue(obj: unknown): void {
    if (obj === undefined) obj = null;

    if (obj === null || obj instanceof TuiDayRange) return this.control.setValue(obj);

    console.warn('Invalid value for DatePeriodComponent', obj);
  }

  registerOnChange(fn: any): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe((data) => fn(data));
  }

  registerOnTouched(fn: any): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe((data) => fn(data));
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.control.disable();
    else this.control.enable();
  }
}
