import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, OnInit, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PublicData } from '@core/lib/interfaces/public-data';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { SettingValue } from '@core/lib/settings';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { strTimeTimezone } from '@core/lib/str-time-timezone';
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';
import { ReservationTurn } from '@core/models/reservation-turn';
import { PublicPagesDataService } from '@core/services/http/public-pages-data.service';
import { PublicReservationsService } from '@core/services/http/public-reservations.service';
import { PublicReservationsV2Service, vtimes } from '@core/services/http/public-reservationsv2.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiBooleanHandler, TuiDay, TuiDestroyService, TuiMonth, TuiTime } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiCalendarModule, TuiHostedDropdownComponent, TuiHostedDropdownModule, TuiPrimitiveTextfieldModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TUI_ARROW, TuiCheckboxBlockModule } from '@taiga-ui/kit';
import { merge, takeUntil, filter, finalize } from 'rxjs';
import { PolymorpheusContent, PolymorpheusModule } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [
    MatIconModule,
    ReactiveFormsModule,
    TuiButtonModule,
    TuiHostedDropdownModule,
    TuiPrimitiveTextfieldModule,
    TuiTextfieldControllerModule,
    TuiCalendarModule,
    TuiCheckboxBlockModule,
    PolymorpheusModule,
  ],
  templateUrl: './date-input.component.html',
  providers: [
    TuiDestroyService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: DateInputComponent,
      multi: true,
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateInputComponent implements ControlValueAccessor, OnInit {
  private readonly cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly publicDataService: PublicPagesDataService = inject(PublicPagesDataService);
  private readonly reservationsService: PublicReservationsService = inject(PublicReservationsService);
  private readonly datePipe = inject(DatePipe);

  @ViewChild("dateDropdown") dropdown?: TuiHostedDropdownComponent;

  readonly maxDaysInAdvance: WritableSignal<number> = signal(300);

  private readonly defaultDateValue: TuiDay = TuiDay.currentLocal();
  readonly control: FormControl<TuiDay | null> = new FormControl<TuiDay | null>(this.defaultDateValue);

  private readonly defaultDateReadonly: string = $localize`Seleziona una data`;
  readonly dateReadonly: WritableSignal<string> = signal(this.defaultDateReadonly);

  readonly loadingDates: WritableSignal<boolean> = signal(false);
  readonly TUI_ARROW = TUI_ARROW;

  readonly maxDate: WritableSignal<TuiDay | null> = signal(null);
  readonly showOnlyValidDates: WritableSignal<boolean> = signal(false);

  readonly today: WritableSignal<TuiDay> = signal(TuiDay.currentLocal());
  readonly validDates: WritableSignal<readonly TuiDay[]> = signal<readonly TuiDay[]>([]);
  readonly disabledDates: TuiBooleanHandler<TuiDay> = (day: TuiDay): boolean => {
    if (!this.showOnlyValidDates()) return false;

    if (day.dayBefore(this.today())) return true;
    if (day.dayAfter(this.today().append({ day: this.maxDaysInAdvance() }))) return true;

    // If no valid dates are provided, don't disable any day.
    if (this.validDates().length === 0) return false;

    // If day is after the last valid date, dont disable it as we may have not loaded the next valid dates yet.
    if (day.dayAfter(this.validDates()[this.validDates().length - 1])) return false;

    return (this.validDates().find((d: TuiDay) => d.daySame(day))) ? false : true;
  };

  ngOnInit(): void {
    this.loadPublicData();
    this.formUpdated();
  }

  onDayClick($event: TuiDay): void {
    this.control.setValue($event);
    // dropdownToClose.close();
    this.dropdown?.close();
  }

  touched(): void {
    // this.inputTouch.emit();
  }

  onMonthChange(m: TuiMonth) {
    this.loadDates(m);
  }

  writeValue(obj: any): void {
    this.control.setValue(obj);
  }

  registerOnChange(fn: any): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value: TuiDay | null) => {
      this.formUpdated();
      fn(value);
    });
  }

  registerOnTouched(fn: any): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value: TuiDay | null) => {
      this.touched();
      fn(value);
    });
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

  findValidDate(): void {
    // this.hasSeenInvalidDateMessage.set(true);
    this.showOnlyValidDates.set(true);
    this.control.reset(this.defaultDateValue);
    if (this.dropdown) {
      this.dropdown.open = true;
    }
  }

  private loadDates(month: TuiMonth = TuiMonth.currentLocal()): void {
    const from = new TuiDay(month.year, month.month, 1);
    const to = from.append({ month: 1 }).append({ day: -1 });

    this.loadingDates.set(true);
    this.reservationsService.getValidDates({
      from_date: this.datePipe.transform(from.toUtcNativeDate(), 'yyyy-MM-dd') || '',
      to_date: this.datePipe.transform(to.toUtcNativeDate(), 'yyyy-MM-dd') || ''
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingDates.set(false)),
    ).subscribe({
      next: (response: TuiDay[]) => {
        // Concatenate the new dates with the existing ones but avoid duplicates.
        this.validDates.update((dates: readonly TuiDay[]): TuiDay[] => {
          let all: TuiDay[] = [...dates];
          response.forEach((date: TuiDay) => {
            if (!all.find((d: TuiDay) => d.daySame(date))) all.push(date);
          })

          return all;
        })
      },
      error: (error: unknown): void => {
        console.error(error);
        this.notifications.error(error instanceof HttpErrorResponse ? parseHttpErrorMessage(error) : SOMETHING_WENT_WRONG_MESSAGE);
      }
    });
  }

  private loadPublicData(): void {
    this.publicDataService.data$.pipe(
      takeUntil(this.destroy$),
      filter((data: PublicData | null): data is PublicData => data !== null)
    ).subscribe({
      next: (data: PublicData) => {
        const maxDaysInAdvance: SettingValue | null = data.settings["reservation_max_days_in_advance"] ?? null;
        this.maxDaysInAdvance.set(maxDaysInAdvance ? Number(maxDaysInAdvance) : this.maxDaysInAdvance());
        this.updateMaxDate();
      }
    })
  }

  private formUpdated(): void {
    // this.formSubmitted.set(false);

    this.dateReadonly.set(
      this.datePipe.transform(this.control.value?.toUtcNativeDate(), "d MMMM") ?? this.defaultDateReadonly
    );

    this.cd.detectChanges();
  }

  private updateMaxDate(): void {
    this.maxDate.set(
      this.today().append({ day: this.maxDaysInAdvance() })
    );
  }
}
