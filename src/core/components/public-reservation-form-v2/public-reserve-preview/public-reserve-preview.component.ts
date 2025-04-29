import { DatePipe, JsonPipe, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, computed, ElementRef, EventEmitter, Inject, inject, Input, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicData } from '@core/lib/interfaces/public-data';
import { SettingValue } from '@core/lib/settings';
import { PublicPagesDataService } from '@core/services/http/public-pages-data.service';
import { PublicReservationsService } from '@core/services/http/public-reservations.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiBooleanHandler, TuiContextWithImplicit, TuiDay, TuiDestroyService, TuiMonth, TuiTime } from '@taiga-ui/cdk';
import { takeUntil, filter, finalize, merge } from 'rxjs';
import { ErrorsComponent } from "../../errors/errors.component";
import { TuiButtonModule, TuiCalendarModule, TuiDataListModule, TuiGroupModule, TuiHostedDropdownModule, TuiPrimitiveTextfieldModule, TuiSizeL, TuiSizeM, TuiSizeS, TuiSvgModule, TuiTextfieldControllerModule, TuiWrapperModule } from '@taiga-ui/core';
import { MatIconModule } from '@angular/material/icon';
import { TUI_ARROW, TUI_ARROW_MODE, TUI_ARROW_OPTIONS, TuiArrowMode, TuiArrowModule, TuiArrowOptions, TuiCheckboxBlockModule, TuiDataListWrapperModule, TuiInputDateModule, TuiSelectModule } from '@taiga-ui/kit';
import { PolymorpheusContent, PolymorpheusModule } from '@tinkoff/ng-polymorpheus';
import { HttpErrorResponse } from '@angular/common/http';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { PublicReservationsV2Service, vtimes } from '@core/services/http/public-reservationsv2.service';
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';
import { strTimeTimezone } from '@core/lib/str-time-timezone';
import { ReservationTurn } from '@core/models/reservation-turn';
import { LinkifyPipe } from "../../../pipes/linkify.pipe";

@Component({
  selector: 'app-public-reserve-preview',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    JsonPipe,
    ErrorsComponent,
    TuiGroupModule,
    TuiButtonModule,
    TuiHostedDropdownModule,
    MatIconModule,
    TuiDataListModule,
    TuiSelectModule,
    TuiDataListWrapperModule,
    TuiTextfieldControllerModule,
    TuiInputDateModule,
    TuiPrimitiveTextfieldModule,
    TuiCalendarModule,
    TuiWrapperModule,
    // PolymorpheusModule,
    PolymorpheusModule,
    TuiArrowModule,
    TuiSvgModule,
    TuiCheckboxBlockModule,
    NgClass,
    LinkifyPipe,
    DatePipe,
  ],
  templateUrl: './public-reserve-preview.component.html',
  styleUrl: './public-reserve-preview.component.scss',
  providers: [
    TuiDestroyService,
  ]
})
export class PublicReservePreviewComponent {

  private readonly cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly reservationsv2: PublicReservationsV2Service = inject(PublicReservationsV2Service);
  private readonly reservations: PublicReservationsService = inject(PublicReservationsService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly publicDataService: PublicPagesDataService = inject(PublicPagesDataService);

  @Output() submitted: EventEmitter<{ date: string, time: string, people: number }> = new EventEmitter<{ date: string, time: string, people: number }>();

  readonly maxDaysInAdvance: WritableSignal<number> = signal(300);

  readonly formSubmitted: WritableSignal<boolean> = signal(false);

  readonly warningsToShow: WritableSignal<string[]> = signal<string[]>([]);
  readonly form = new FormGroup({
    people: new FormControl<number | null>(2, [Validators.required, Validators.min(1), Validators.max(20)]),
    date: new FormControl<TuiDay | null>(TuiDay.currentLocal(), [Validators.required]),
    time: new FormControl<TuiTime | null>(null, [Validators.required]),
    showOnlyValidDates: new FormControl<boolean>(true),
  });

  private readonly paymentGroupDefaultMessage: string = $localize`Per assicurarti uno dei nostri tavoli sarà necessaria una preautorizzazione della carta di credito.`;
  readonly warningAccepted: FormControl<boolean | null> = new FormControl<boolean | null>(false);
  readonly groups: WritableSignal<{ [time: string]: PreorderReservationGroup }> = signal<{ [time: string]: PreorderReservationGroup }>({});
  private readonly reservationsService: PublicReservationsService = inject(PublicReservationsService);
  readonly peopleArray: WritableSignal<number[]> = signal(Array.from({ length: 10 }).map((_: unknown, i: number): number => i + 1));

  private readonly defaultDateReadonly: string = $localize`Seleziona una data`;
  readonly dateReadonly: WritableSignal<string> = signal(this.defaultDateReadonly);
  readonly messages: WritableSignal<{ [time: string]: string[] }> = signal<{ [time: string]: string[] }>({});

  readonly loadingTimes: WritableSignal<boolean> = signal(false);
  readonly loadingDates: WritableSignal<boolean> = signal(false);
  private readonly datePipe = inject(DatePipe);
  readonly holidayMessages: WritableSignal<string[]> = signal<string[]>([]);
  readonly TUI_ARROW = TUI_ARROW;
  readonly validTimes: WritableSignal<readonly TuiTime[]> = signal<readonly TuiTime[]>([]);
  readonly hasSeenInvalidDateMessage: WritableSignal<boolean> = signal(false);

  readonly loadedValidTimes: WritableSignal<boolean> = signal(false);

  readonly maxDate: WritableSignal<TuiDay | null> = signal(null);

  @ViewChild("warningsDiv") warningsDiv?: ElementRef<HTMLDivElement>;

  readonly today: WritableSignal<TuiDay> = signal(TuiDay.currentLocal());
  readonly validDates: WritableSignal<readonly TuiDay[]> = signal<readonly TuiDay[]>([]);
  readonly disabledDates: TuiBooleanHandler<TuiDay> = (day: TuiDay): boolean => {
    if (!this.form.controls.showOnlyValidDates.value) return false;

    if (day.dayBefore(this.today())) return true;
    if (day.dayAfter(this.today().append({ day: this.maxDaysInAdvance() }))) return true;

    // If no valid dates are provided, don't disable any day.
    if (this.validDates().length === 0) return false;

    // If day is after the last valid date, dont disable it as we may have not loaded the next valid dates yet.
    if (day.dayAfter(this.validDates()[this.validDates().length - 1])) return false;

    return (this.validDates().find((d: TuiDay) => d.daySame(day))) ? false : true;
  };

  ngOnInit(): void {

    merge(
      this.form.controls.people.valueChanges.pipe(
        takeUntil(this.destroy$),
        filter((): boolean => this.form.controls.people.valid),
      ),
      this.form.controls.date.valueChanges.pipe(
        takeUntil(this.destroy$),
        filter((): boolean => this.form.controls.date.valid),
      ),
    ).subscribe((): void => {
      this.peopleOrDateChanged();
    });

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.formUpdated();
    });

    this.form.controls.time.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (p: TuiTime | null): void => {
        this.warningAccepted.setValue(false);

        let warnings: string[] = [];
        // this.tableTypes.set([]);

        if (p) {
          const paymentGrp: PreorderReservationGroup | null = this.groups()[p.toString()];

          if (paymentGrp) {
            warnings.push(
              paymentGrp?.message || this.paymentGroupDefaultMessage
            );
          }

          // this.tableTypes.set(paymentGrp?.table_type_to_preorder_reservation_groups || [])

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

    this.loadPublicData();
    this.formUpdated();
    // this.loadValidTimes();
  }

  findValidDate(): void {
    this.hasSeenInvalidDateMessage.set(true);
    this.form.controls.showOnlyValidDates.setValue(true);
    this.form.controls.date.reset();
  }

  onFormSubmit() {
    this.formSubmitted.set(true);
    this.loadValidTimes();
  }

  onDayClick($event: TuiDay, dropdownToClose: { close: () => void }): void {
    this.form.controls.date.setValue($event);
    dropdownToClose.close();
  }

  onTimeClick(time: TuiTime) {
    this.form.controls.time.setValue(time);
  }

  touched(): void {
    // this.inputTouch.emit();
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

  private loadPublicData(): void {
    this.publicDataService.data$.pipe(
      takeUntil(this.destroy$),
      filter((data: PublicData | null): data is PublicData => data !== null)
    ).subscribe({
      next: (data: PublicData) => {
        const maxPeople: SettingValue | null = data.settings["max_people_per_reservation"] ?? null;
        this.updateMaxPeople(Number(maxPeople));

        const maxDaysInAdvance: SettingValue | null = data.settings["reservation_max_days_in_advance"] ?? null;
        this.maxDaysInAdvance.set(maxDaysInAdvance ? Number(maxDaysInAdvance) : this.maxDaysInAdvance());
        this.updateMaxDate();
      }
    })
  }

  private loadValidTimes(): void {
    this.loadedValidTimes.set(true);
    const date: TuiDay | null = this.form.controls.date.value;
    const people: number | null = this.form.controls.people.value;

    if (!date || !people) return;

    this.loadingTimes.set(true);
    this.reservationsv2.getValidTimes({ date, people }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingTimes.set(false)),
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

  private updateMaxPeople(value: number): void {
    this.peopleArray.set(Array.from({ length: value }).map((_: unknown, i: number): number => i + 1));
  }

  private formUpdated(): void {
    this.formSubmitted.set(false);

    this.dateReadonly.set(
      this.datePipe.transform(this.form.value.date?.toUtcNativeDate(), "d MMMM") ?? this.defaultDateReadonly
    );

    this.cd.detectChanges();
  }

  private peopleOrDateChanged(): void {
    this.form.controls.time.setValue(null);
    this.validTimes.set([]);
    this.groups.set({});
    this.loadValidTimes();
  }

  private updateMaxDate(): void {
    this.maxDate.set(
      this.today().append({ day: this.maxDaysInAdvance() })
    );
  }
}
