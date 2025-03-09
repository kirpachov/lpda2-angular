import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, inject, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { TuiDay, TuiDayRange, TuiDestroyService } from "@taiga-ui/cdk";
import { takeUntil, Subscription } from "rxjs";
import { MatIcon } from "@angular/material/icon";
import { TuiCalendarRangeModule, TuiDayRangePeriod } from "@taiga-ui/kit";
import { DatePipe } from '@angular/common';
import { FromTuiDayPipe } from "../../pipes/from-tui-day.pipe";
import {
  TuiCalendarModule,
  TuiDataListModule,
  TuiDialogContext, TuiDialogService,
   TuiHintModule,
} from "@taiga-ui/core";
import { PolymorpheusContent } from "@tinkoff/ng-polymorpheus";
import { StringifyTuiDayRangePipe } from "../../pipes/stringify-tui-day-range.pipe";

@Component({
  selector: 'app-reservation-date-select',
  standalone: true,
  imports: [
    MatIcon,
    ReactiveFormsModule,
    DatePipe,
    FromTuiDayPipe,
    TuiCalendarRangeModule,
    StringifyTuiDayRangePipe,
    TuiHintModule,

    TuiDataListModule,
    TuiCalendarModule,
],
  templateUrl: './reservation-date-select.component.html',
  styleUrl: './reservation-date-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReservationDateSelectComponent),
      multi: true
    },

    TuiDestroyService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDateSelectComponent implements OnInit, ControlValueAccessor {

  private readonly cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly date: DatePipe = inject(DatePipe);

  readonly today: TuiDay = TuiDay.currentLocal();
  readonly calendarMin: TuiDay = new TuiDay(2019, 1, 1);
  readonly calendarMax: TuiDay = this.today.append({ year: 1 });

  readonly control: FormControl<null | TuiDayRange> = new FormControl<null | TuiDayRange>(new TuiDayRange(this.today, this.today));

  readonly periodOptions: TuiDayRangePeriod[] = [
    new TuiDayRangePeriod(new TuiDayRange(this.today, this.today), $localize`Oggi`),
    new TuiDayRangePeriod(new TuiDayRange(this.today.append({ day: -7 }), this.today), $localize`Ultima settimana`),

    /**
     * I want last 3 months.
     * If now is 2 dec 2024, I need to see:
     * - November 2024 (from 1st nov 2024 to 30 nov 2024)
     * - Oct 2024 (from 1st oct 2024 to 31 oct 2024)
     */
    ...Array.from({ length: 3 }, (_, i) => i).map((i: number): TuiDayRangePeriod => {
      const lastMonth = this.today.append({ month: i * -1 });
      const lastMonthFirstDay = new TuiDay(lastMonth.year, lastMonth.month, 1);

      const name: string = this.date.transform(
        lastMonthFirstDay.toUtcNativeDate(),
        `MMMM`
      ) || `Mese ${lastMonthFirstDay.month}`;

      return new TuiDayRangePeriod(
        new TuiDayRange(
          lastMonthFirstDay,
          lastMonthFirstDay.append({month: 1}).append({day: -1})
        ),
        name
      );
    }
    )
  ];


  ngOnInit(): void { }

  registerOnChange(fn: () => unknown): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe(fn);
  }

  registerOnTouched(fn: () => unknown): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.control.disable();
    else this.control.enable();
  }

  writeValue(obj: any): void {
    this.control.patchValue(this.formatToTuiDayRange(obj));
  }

  // private modalSub?: Subscription;
  fireModal(temp: PolymorpheusContent<TuiDialogContext>): void {
    // this.modalSub =
    this.dialogs.open(temp).subscribe();
  }

  selectRangeAndUnsub(range: TuiDayRange | null, ...subs: Subscription[]): void {
    this.selectRange(range);
    subs.forEach((s) => s.unsubscribe());
  }

  selectDayAndUnsub(day: TuiDay | null, sub: Subscription): void {
    this.selectDay(day);
    sub.unsubscribe();
  }

  private selectDay(day: TuiDay | null) {
    this.selectRange(day ? new TuiDayRange(day, day) : null);
  }

  private selectRange($event: TuiDayRange|null) {
    this.control.setValue($event);
    // this.modalSub?.unsubscribe();
    this.cd.markForCheck();
  }

  prevDay(): void {
    if (!(this.control.value instanceof TuiDayRange)) {
      console.warn(`control value invalid`, this.control.value);
      return;
    }

    const from = this.control.value.from.append({ day: -1 });
    const to = this.control.value.to.append({ day: -1 });
    this.control.setValue(new TuiDayRange(from, to));
  }

  nextDay(): void {
    if (!(this.control.value instanceof TuiDayRange)) {
      console.warn(`control value invalid`, this.control.value);
      return;
    }

    const from = this.control.value.from.append({ day: +1 });
    const to = this.control.value.to.append({ day: +1 });
    this.control.setValue(new TuiDayRange(from, to));
  }

  /**
   * Will try to convert input to a TuiDayRange instance.
   * Will accept:
   * - TuiDayRange
   * - Date
   * - string
   * - [Date, Date]
   * - [TuiDay, TuiDay]
   * - [string, string]
   * - null
   * - undefined
   */
  private formatToTuiDayRange(obj: unknown): TuiDayRange | null {
    if (obj === null || obj === undefined) return null;
    if (obj instanceof TuiDayRange) return obj;
    if (obj instanceof Date) return new TuiDayRange(TuiDay.fromLocalNativeDate(obj), TuiDay.fromLocalNativeDate(obj));
    if (typeof obj == 'string') return new TuiDayRange(TuiDay.fromLocalNativeDate(new Date(obj)), TuiDay.fromLocalNativeDate(new Date(obj)));
    if (Array.isArray(obj) && obj.length == 2) {
      if (obj[0] instanceof Date && obj[1] instanceof Date)
        return new TuiDayRange(TuiDay.fromLocalNativeDate(obj[0]), TuiDay.fromLocalNativeDate(obj[1]));
      
      if (obj[0] instanceof TuiDay && obj[1] instanceof TuiDay)
        return new TuiDayRange(obj[0], obj[1]);

      if (typeof obj[0] == 'string' && typeof obj[1] == 'string')
        return new TuiDayRange(TuiDay.fromLocalNativeDate(new Date(obj[0])), TuiDay.fromLocalNativeDate(new Date(obj[1])));
    }

    console.warn(`Invalid value for reservation date select:`, obj);

    return null;
  }
}
