import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  EventEmitter,
  inject, Input, ViewChild, ElementRef,
  OnInit,
  Output,
  signal,
  SimpleChanges,
  WritableSignal,
  computed
} from '@angular/core';
import { TuiBooleanHandler, TuiDay, TuiDestroyService, TuiMonth, TuiScrollService, TuiTime } from "@taiga-ui/cdk";
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from "@angular/forms";
import { TuiButtonModule, TuiCalendarModule, TuiExpandModule, TuiLoaderModule } from "@taiga-ui/core";
import { filter, finalize, merge, switchMap, take, takeUntil, tap } from "rxjs";
import { isoStringToTuiDay, isoStringToTuiTime, tuiDatetimeToIsoString } from "@core/lib/tui-datetime-to-iso-string";
import { ReservationTurn } from "@core/models/reservation-turn";
import { strTimeTimezone } from "@core/lib/str-time-timezone";
import { CurrencyPipe, DatePipe, JsonPipe, NgClass } from "@angular/common";
import { ReservationsService } from "@core/services/http/reservations.service";
import { MatIcon } from "@angular/material/icon";
import { NotificationsService } from "@core/services/notifications.service";
import { HttpErrorResponse } from "@angular/common/http";
import { parseHttpErrorMessage } from "@core/lib/parse-http-error-message";
import { SOMETHING_WENT_WRONG_MESSAGE } from "@core/lib/something-went-wrong-message";
import { PublicReservationsService } from "@core/services/http/public-reservations.service";
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';
import { TuiCheckboxBlockModule, TuiCheckboxModule } from '@taiga-ui/kit';
import { PublicReservationsV2Service, vtimes } from '@core/services/http/public-reservationsv2.service';
import { LinkifyPipe } from "../../../pipes/linkify.pipe";
import { TableTypeToPreorderReservationGroup } from '@core/lib/interfaces/table-type-to-preorder-reservation-group';
import { PublicShowImagesComponent } from "../../public-show-images/public-show-images.component";

@Component({
  selector: 'app-datetime-input',
  standalone: true,
  imports: [
    TuiExpandModule,
    TuiCalendarModule,
    TuiButtonModule,
    NgClass,
    DatePipe,
    MatIcon,
    TuiLoaderModule,
    TuiCheckboxBlockModule,
    ReactiveFormsModule,
    // JsonPipe,
    CurrencyPipe,
    TuiCheckboxModule,
    FormsModule,
    LinkifyPipe,
    PublicShowImagesComponent
],
  templateUrl: './datetime-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,

    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: DatetimeInputComponent,
      multi: true
    }
  ]
})
export class DatetimeInputComponent implements OnInit, ControlValueAccessor {
  private readonly cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly reservationsService: PublicReservationsService = inject(PublicReservationsService);
  private readonly reservationsv2: PublicReservationsV2Service = inject(PublicReservationsV2Service);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly destroy$ = inject(TuiDestroyService);
  private readonly datePipe: DatePipe = inject(DatePipe);

  // At first, user can select any date. After the user requests so, only valid dates will be shown.
  readonly showOnlyValidDates: WritableSignal<boolean> = signal(false);
  readonly hasSeenInvalidDateMessage: WritableSignal<boolean> = signal(false);

  @Output() readonly valueChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() readonly inputTouch: EventEmitter<void> = new EventEmitter<void>();

  readonly lastDate: WritableSignal<TuiDay | null> = signal<TuiDay | null>(null);

  readonly date: FormControl<TuiDay | null> = new FormControl(null, [Validators.required]);
  readonly time: FormControl<TuiTime | null> = new FormControl(null, [Validators.required]);
  // readonly group: WritableSignal<PreorderReservationGroup | null> = signal<PreorderReservationGroup | null>(null);

  readonly warningAccepted: FormControl<boolean | null> = new FormControl<boolean | null>(false);
  readonly groups: WritableSignal<{ [time: string]: PreorderReservationGroup }> = signal<{ [time: string]: PreorderReservationGroup }>({});
  readonly messages: WritableSignal<{ [time: string]: string[] }> = signal<{ [time: string]: string[] }>({});
  readonly warningsToShow: WritableSignal<string[]> = signal<string[]>([]);
  readonly validDates: WritableSignal<readonly TuiDay[]> = signal<readonly TuiDay[]>([]);
  readonly validTimes: WritableSignal<readonly TuiTime[]> = signal<readonly TuiTime[]>([]);
  readonly loadingTimes: WritableSignal<boolean> = signal(false);
  readonly loadingDates: WritableSignal<boolean> = signal(false);
  readonly holidayMessages: WritableSignal<string[]> = signal<string[]>([]);

  readonly today: WritableSignal<TuiDay> = signal(TuiDay.currentLocal());

  private readonly paymentGroupDefaultMessage: string = $localize`Per assicurarti uno dei nostri tavoli sarà necessario un pagamento che verrà scalato dal conto finale al ristorante.`;
  readonly tableTypes: WritableSignal<TableTypeToPreorderReservationGroup[]> = signal<TableTypeToPreorderReservationGroup[]>([]);

  @Output() tableTypeIdChange: EventEmitter<number | null> = new EventEmitter<number | null>();
  tableTypeId: WritableSignal<number | null> = signal(null);
  @Input({alias: `tableTypeId`}) set tableTypeIdInput(value: number | null) {
    this.tableTypeId.set(value);
  }

  // @Input() tableTypeIdControl: FormControl<number | null> = new FormControl<number | null>(null);

  @Input() maxDaysInAdvance: number = 300;

  readonly maxDate: WritableSignal<TuiDay | null> = signal(null);
  readonly lastDateAfterMaxDate = computed(() => {
    const last = this.lastDate();
    const max = this.maxDate();
    if (last && max) return last.dayAfter(max);

    return false;
  });

  @ViewChild("warningsDiv") warningsDiv?: ElementRef<HTMLDivElement>;

  readonly disabledDates: TuiBooleanHandler<TuiDay> = (day: TuiDay): boolean => {
    if (!this.showOnlyValidDates()) return false;

    if (day.dayBefore(this.today())) return true;
    if (day.dayAfter(this.today().append({ day: this.maxDaysInAdvance }))) return true;

    // If no valid dates are provided, don't disable any day.
    if (this.validDates().length === 0) return false;

    // If day is after the last valid date, dont disable it as we may have not loaded the next valid dates yet.
    if (day.dayAfter(this.validDates()[this.validDates().length - 1])) return false;

    return (this.validDates().find((d: TuiDay) => d.daySame(day))) ? false : true;
  };

  ngOnInit(): void {
    this.updateMaxDate();
    this.loadDates();

    this.date.valueChanges.pipe(
      takeUntil(this.destroy$),
      tap(() => this.time.setValue(null)),
      tap((day: TuiDay | null) => { if (day) this.lastDate.set(day) })
    ).subscribe();

    this.time.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (p: TuiTime | null): void => {
        this.warningAccepted.setValue(false);

        let warnings: string[] = [];
        this.tableTypes.set([]);

        if (p) {
          const paymentGrp: PreorderReservationGroup | null = this.groups()[p.toString()];

          if (paymentGrp) {
            warnings.push(
              paymentGrp?.message || this.paymentGroupDefaultMessage
            );
          }

          this.tableTypes.set(paymentGrp?.table_type_to_preorder_reservation_groups || [])

          const msg: string[] = this.messages()[p.toString()];
          if (msg) {
            warnings = [...warnings, ...msg];
          }
        }

        this.warningsToShow.set(warnings);

        setTimeout(() => {
          if (this.warningsToShow().length && this.warningsDiv?.nativeElement) {
            this.warningsDiv.nativeElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center"
            });
          }
        })
      }
    });

    merge(
      this.date.valueChanges.pipe(
        takeUntil(this.destroy$),
        filter(() => this.date.valid)
      ),
      this.time.valueChanges.pipe(
        takeUntil(this.destroy$),
        filter(() => this.time.valid)
      ),
      this.warningAccepted.valueChanges.pipe(
        takeUntil(this.destroy$),
        filter(() => this.warningAccepted.value === true),
      )
    ).subscribe({
      next: (): void => {
        this.touched();
        const date: TuiDay | null = this.date.value;
        const time: TuiTime | null = this.time.value;
        if (date && time) {
          if (this.warningsToShow().length === 0 || this.warningAccepted.value) {
            this.emit(tuiDatetimeToIsoString(date, time));
          }
        }
      }
    });

    this.date.valueChanges.pipe(
      takeUntil(this.destroy$),
      filter((date: TuiDay | null): date is TuiDay => date instanceof TuiDay),
      tap(() => this.loadingTimes.set(true)),
      switchMap((date: TuiDay) => this.reservationsv2.getValidTimes(date).pipe(
        finalize(() => this.loadingTimes.set(false)),
      ))
    ).subscribe({
      next: (data: vtimes) => {
        const hmessages: string[] = [];
        data.holidays.forEach((holiday) => {
          if (holiday.message && typeof holiday.message === "string" && holiday.message.length > 0) {
            hmessages.push(holiday.message);
          }
        });

        this.holidayMessages.set(hmessages);

        const times: string[] = data.turns.map((turn: ReservationTurn) => turn.valid_times).filter((times: string[] | undefined): times is string[] => Array.isArray(times) && times.length > 0).flat();
        this.validTimes.set(times.map((time: string) => TuiTime.fromString(strTimeTimezone(time))).sort((a: TuiTime, b: TuiTime) => a.toAbsoluteMilliseconds() - b.toAbsoluteMilliseconds()));

        this.groups.set(
          data.turns.reduce((acc: { [time: string]: PreorderReservationGroup }, turn: ReservationTurn) => {
            turn.valid_times?.forEach((time: string) => {
              if (turn.preorder_reservation_group) acc[strTimeTimezone(time)] = turn.preorder_reservation_group;
            });
            return acc;
          }, {})
        );


        const messages: Record<string, string[]> = {};
        data.turns.forEach((turn: ReservationTurn) => {
          turn.valid_times?.forEach((time: string) => {
            (turn.messages || []).forEach((msg) => {
              if (msg && typeof msg.message === "string" && msg.message.length > 0) {
                messages[strTimeTimezone(time)] ||= [];
                messages[strTimeTimezone(time)].push(msg.message);
              }
            });
          });
        });
        this.messages.set(messages);
      },
      error: (error: unknown): void => {
        this.notifications.error(error instanceof HttpErrorResponse ? parseHttpErrorMessage(error) : SOMETHING_WENT_WRONG_MESSAGE);
      }
    });
  }

  updateTableTypeId(tid: number | null) {
    this.tableTypeId.set(tid);
    this.tableTypeIdChange.emit(tid);
  }

  findValidDate(): void {
    this.hasSeenInvalidDateMessage.set(true);
    this.showOnlyValidDates.set(true);
    this.date.reset();
  }

  writeValue(obj: unknown): void {
    if (obj === null || obj === undefined) {
      this.date.reset();
      this.time.reset();

      return;
    }

    if (typeof obj === "string") {
      this.date.setValue(isoStringToTuiDay(obj));
      this.time.setValue(isoStringToTuiTime(obj));
      setTimeout(() => this.cd.detectChanges());
      return;
    }

    console.warn(`Invalid parameter provided to writeValue`, { obj });
    // console.warn(`TODO: implement writeValue`, obj);
  }

  registerOnChange(fn: any): void {
    this.valueChanged.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.inputTouch.subscribe(fn);
  }

  // groupAccepted(): boolean {
  //   if (!(this.group())) return true;

  //   console.warn("missing groupAccepted()");
  //   return false;
  // }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.date.disable();
      this.time.disable();
    } else {
      this.date.enable();
      this.time.enable();
    }
  }

  ngOnChanges(s: SimpleChanges): void {
    this.updateMaxDate();
  }

  onDayClick(day: TuiDay): void {
    this.date.setValue(day);
  }

  touched(): void {
    this.inputTouch.emit();
  }

  private emit(s: string): void {
    this.valueChanged.emit(s);
  }

  onTimeClick(time: TuiTime) {
    this.time.setValue(time);
  }

  onMonthChange(m: TuiMonth) {
    this.loadDates(m);
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

  private updateMaxDate(): void {
    this.maxDate.set(
      TuiDay.currentLocal().append({ day: this.maxDaysInAdvance })
    );
  }
}
