import { DatePipe, JsonPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, ElementRef, EventEmitter, Inject, inject, Input, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicData } from '@core/lib/interfaces/public-data';
import { SettingValue } from '@core/lib/settings';
import { PublicPagesDataService } from '@core/services/http/public-pages-data.service';
import { PublicReservationsService } from '@core/services/http/public-reservations.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiBooleanHandler, TuiContextWithImplicit, TuiDay, TuiDestroyService, TuiMonth, TuiTime } from '@taiga-ui/cdk';
import { takeUntil, filter, finalize, merge, map, distinctUntilChanged } from 'rxjs';
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
import { PeopleInputComponent } from "./people-input/people-input.component";
import { DateInputComponent } from "./date-input/date-input.component";
import { TimeInputComponent } from "./time-input/time-input.component";
import { ActivatedRoute, Params } from '@angular/router';
import { stringToTuiDay, stringToTuiTime } from '@core/lib/tui-datetime-to-iso-string';

@Component({
  selector: 'app-public-reserve-preview',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiGroupModule,
    TuiButtonModule,
    LinkifyPipe,
    DatePipe,
    PeopleInputComponent,
    DateInputComponent,
    TimeInputComponent,
    // JsonPipe,
  ],
  templateUrl: './public-reserve-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
  ],
})
export class PublicReservePreviewComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly reservationsv2: PublicReservationsV2Service = inject(PublicReservationsV2Service);
  private readonly notifications: NotificationsService = inject(NotificationsService);

  @Output() submitted: EventEmitter<{ date: string, time: string, people: number }> = new EventEmitter<{ date: string, time: string, people: number }>();

  readonly warningsToShow: WritableSignal<string[]> = signal<string[]>([]);
  readonly form = new FormGroup({
    people: new FormControl<number | null>(
      Number(this.route.snapshot.queryParams["people"]) || 2, [Validators.required, Validators.min(1), Validators.max(20)]),

    date: new FormControl<TuiDay | null>(
      stringToTuiDay(this.route.snapshot.queryParams["date"]) || TuiDay.currentLocal(), [Validators.required]),

    time: new FormControl<TuiTime | null>(
      stringToTuiTime(this.route.snapshot.queryParams["time"]) || null
      , [Validators.required]),
  });

  readonly messages: WritableSignal<{ [time: string]: string[] }> = signal<{ [time: string]: string[] }>({});

  readonly loadingTimes: WritableSignal<boolean> = signal(false);
  readonly holidayMessages: WritableSignal<string[]> = signal<string[]>([]);
  readonly validTimes: WritableSignal<readonly TuiTime[]> = signal<readonly TuiTime[]>([]);

  @ViewChild("warningsDiv") warningsDiv?: ElementRef<HTMLDivElement>;

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

    this.loadValidTimes();
  }

  onFormSubmit() {
    // this.formSubmitted.set(true);
    // this.loadValidTimes();
  }

  onDayClick($event: TuiDay, dropdownToClose: { close: () => void }): void {
    this.form.controls.date.setValue($event);
    dropdownToClose.close();
  }

  touched(): void {
    // this.inputTouch.emit();
  }

  private loadValidTimes(): void {
    // this.loadedValidTimes.set(true);
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

  private peopleOrDateChanged(): void {
    this.form.controls.time.setValue(null);
    this.validTimes.set([]);
    this.loadValidTimes();
  }
}
