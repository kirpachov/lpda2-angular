import {Component, EventEmitter, Inject, inject, Input, OnInit, Output, signal, WritableSignal} from '@angular/core';
import {ErrorsComponent} from "@core/components/errors/errors.component";
import {FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from "@angular/forms";
import {I18nInputComponent} from "@core/components/i18n-input/i18n-input.component";
import {TuiButtonModule, TuiDropdownModule, TuiTextfieldControllerModule} from "@taiga-ui/core";
import {ImageInputComponent} from "@core/components/image-input/image-input.component";
import {Allergen} from "@core/models/allergen";
import {Reservation} from "@core/models/reservation";
import {
  tuiCreateTimePeriods,
  TuiInputDateModule,
  TuiInputDateTimeModule,
  TuiInputModule,
  TuiInputNumberModule,
  TuiInputTimeModule
} from "@taiga-ui/kit";
import {TUI_IS_MOBILE, TuiAutoFocusModule, TuiDay, TuiDestroyService, TuiTime} from "@taiga-ui/cdk";
import {ReservationsService} from "@core/services/http/reservations.service";
import {filter, finalize, map, switchMap, takeUntil, takeWhile, tap} from "rxjs";
import {ReservationTurn} from "@core/models/reservation-turn";
import {nue} from "@core/lib/nue";
import {MatIcon} from "@angular/material/icon";
import {DatePipe} from "@angular/common";
import {offsetHours, strTimeTimezone, strToUTC} from "@core/lib/str-time-timezone";
import {tuiDatetimeToIsoString, tuiTimeToIsoString} from "@core/lib/tui-datetime-to-iso-string";
import {
  ReservationTablesSummaryComponent
} from "@core/components/reservation-tables-summary/reservation-tables-summary.component";
import { PublicReservationsService } from '@core/services/http/public-reservations.service';

/**
 * NEW and EDIT reservation's data
 */
@Component({
  selector: 'app-admin-reservation-form',
  standalone: true,
  imports: [
    ErrorsComponent,
    ReactiveFormsModule,
    I18nInputComponent,
    TuiButtonModule,
    ImageInputComponent,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiInputNumberModule,
    TuiInputDateTimeModule,
    TuiInputDateModule,
    TuiInputTimeModule,
    TuiAutoFocusModule,
    TuiDropdownModule,
    MatIcon,
    DatePipe,
    ReservationTablesSummaryComponent,
  ],
  templateUrl: './admin-reservation-form.component.html',
  providers: [
    TuiDestroyService,
    DatePipe
  ]
})
export class AdminReservationFormComponent implements OnInit {
  // private readonly reservationsService: ReservationsService = inject(ReservationsService);
  // private readonly publicRes = inject(PublicReservationsService);
  private readonly destroy$ = inject(TuiDestroyService);
  // private readonly datePipe = inject(DatePipe);

  @Output() formSubmit: EventEmitter<Record<string, any>> = new EventEmitter<Record<string, any>>();
  @Output() cancelled: EventEmitter<void> = new EventEmitter<void>();

  // readonly validTimes: WritableSignal<readonly TuiTime[]> = signal<readonly TuiTime[]>([]);

  readonly utcTime: WritableSignal<string | null> = signal(null);

  readonly today: TuiDay = TuiDay.currentLocal();

  readonly inputSize = 'l';

  @Input() set item(value: Reservation | null | undefined) {
    if (!(value)) {
      this.form.reset();
      return;
    }

    this.form.patchValue({
      date: value.datetime ? new TuiDay(value.datetime?.getFullYear(), value.datetime?.getMonth(), value.datetime?.getDate()) : null,
      time: value.datetime ? (new TuiTime(value.datetime?.getHours(), value.datetime?.getMinutes())).shift({  hours: - offsetHours }) : null,
      fullname: value.fullname,
      adults: value.adults,
      children: value.children,
      email: value.email,
      table: value.table,
      notes: value.notes,
      phone: value.phone,
    })
  }

  readonly form = new FormGroup<{
    date: FormControl<TuiDay | null>,
    time: FormControl<TuiTime | null>, // ?
    fullname: FormControl<string | null>,
    adults: FormControl<number | null>,
    children: FormControl<number | null>,
    email: FormControl<string | null>,
    table: FormControl<string | null>,
    notes: FormControl<string | null>,
    phone: FormControl<string | null>,
  }>({
    date: new FormControl<TuiDay | null>(null, [Validators.required]),
    time: new FormControl(null, [Validators.required]),
    fullname: new FormControl(null, [Validators.required]),
    adults: new FormControl(null, [Validators.required, Validators.min(0)]),
    children: new FormControl(0, [Validators.required, Validators.min(0)]),

    email: new FormControl(null, [Validators.email]),
    table: new FormControl(null),
    notes: new FormControl(null),
    phone: new FormControl(null),
  });

  @Input() loading: boolean = false;

  readonly dateOpen: WritableSignal<boolean> = signal(false);
  // readonly timeOpen: WritableSignal<boolean> = signal(false);

  // readonly loadingTimes: WritableSignal<boolean> = signal(false);

  submitted: boolean = false;

  constructor(
    @Inject(TUI_IS_MOBILE) public readonly isMobile: boolean,
  ) {
  }

  ngOnInit(): void {
    this.dateOpen.set(true);
    // this.timeOpen.set(false);

    this.form.get(`date`)!.valueChanges.pipe(
      takeUntil(this.destroy$),
      filter((date: TuiDay | null): date is TuiDay => date instanceof TuiDay),
      tap(() => this.dateOpen.set(false)),
      // tap(() => this.timeOpen.set(true)),
      // tap(() => this.loadingTimes.set(true)),
      // switchMap((date: TuiDay) => this.publicRes.getValidTimes(date)),
      // finalize(() => this.loadingTimes.set(false)),
    ).subscribe({
      // next: (turns: ReservationTurn[]) => {
      //   const times: string[] = turns.map((turn: ReservationTurn) => turn.valid_times).filter((times: string[] | undefined): times is string[] => Array.isArray(times) && times.length > 0).flat();
      //   this.validTimes.set(times.map((time: string) => TuiTime.fromString(strTimeTimezone(time))));
      // }
    });

    this.form.get(`time`)!.valueChanges.pipe(
      takeUntil(this.destroy$),
      // tap(() => this.timeOpen.set(false)),
      tap((v: TuiTime | null) => this.utcTime.set(v ? strToUTC(v.toString("HH:MM")) : null)),
    ).subscribe(nue());
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.formSubmit.emit(this.formVal());
  }

  private formVal(): Record<string, any> {
    const json: Record<string, any> = this.form.value;

    /**
     * Here we have an issue.
     * User's browser timezone will be probably different from server's timezone.
     * So we need to convert in UTC before sending to server.
     *
     * new Date(...) will create a date in user's timezone.
     *
     */
    if (this.form.value.date && this.form.value.time)
      json["datetime"] = tuiDatetimeToIsoString(this.form.value.date, this.form.value.time);

    delete json["date"];
    delete json["time"];

    return json;
  }

  e = this.errorsFor;

  private errorsFor(controlName: string): ValidationErrors | null {
    const control = this.form.get(controlName);
    if (!(control)) return null;

    if (control.dirty || control.touched || this.submitted) {
      return control.errors;
    }

    return null;
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
