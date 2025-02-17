import { DatePipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, signal, WritableSignal } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { HolidayData } from '@core/lib/interfaces/holiday-data';
import { dateToTuiDay } from '@core/lib/tui-datetime-to-iso-string';
import { Holiday } from '@core/models/holiday';
import { TuiDay, TuiDestroyService, TuiTime } from '@taiga-ui/cdk';
import { WeekdaySelectComponent } from "../../weekday-select/weekday-select.component";
import { ErrorsComponent } from "../../errors/errors.component";
import { TuiCheckboxBlockModule, TuiCheckboxModule, TuiInputTimeModule } from '@taiga-ui/kit';
import { TuiButtonModule, TuiExpandModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { CustomValidators } from '@core/lib/custom-validators';
import { I18nInputComponent } from '@core/components/i18n-input/i18n-input.component';

type WeeklyHolidayOutput = {
  weekday: number;
  weekly_from: string; // "HH:mm"
  weekly_to: string; // "HH:mm"
  message: Record<string, string>
}

@Component({
  selector: 'app-weekly-holiday-form',
  standalone: true,
  imports: [
    WeekdaySelectComponent,
    ReactiveFormsModule,
    ErrorsComponent,
    TuiCheckboxBlockModule,
    TuiExpandModule,
    TuiInputTimeModule,
    TuiButtonModule,
    TuiCheckboxModule,
    TuiTextfieldControllerModule,
    I18nInputComponent,
  ],
  templateUrl: './weekly-holiday-form.component.html',
  providers: [
    TuiDestroyService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeeklyHolidayFormComponent {

  @Output() submitEvent = new EventEmitter<WeeklyHolidayOutput>();
  @Output() cancelEvent: EventEmitter<void> = new EventEmitter<void>();

  readonly submitted: WritableSignal<boolean> = signal(false);

  readonly weeklyFrom = new FormControl<TuiTime | null>(null);
  readonly weeklyTo = new FormControl<TuiTime | null>(null);
  readonly wholeDay = new FormControl<boolean>(true);
  readonly message: FormControl<Record<string, string> | null> = new FormControl<Record<string, string> | null>(null, []);

  readonly form: FormGroup = new FormGroup({
    weekly_from: this.weeklyFrom,
    weekly_to: this.weeklyTo,
    weekday: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(6)]),
    message: this.message,

    wholeDay: this.wholeDay,
  }, {
    validators: [
      CustomValidators.formWeeklyFromTo(`weekly_from`, `weekly_to`),
      CustomValidators.canBeBlankIf(
        `weekly_from`,
        () => this.wholeDay.value === true,
        {
          message: $localize`Inserire l'orario di inizio`
        }
      ),
      CustomValidators.canBeBlankIf(
        `weekly_to`,
        () => this.wholeDay.value === true,
        {
          message: $localize`Inserire l'orario di fine`
        }
      )
    ],
  });

  protected readonly formDefaultValue = this.form.value;

  submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const v = this.formatOutput();
    if (!v) return;

    this.submitEvent.emit(v);
  }

  cancel() {
    this.cancelEvent.emit();
  }

  @Input() set holiday(obj: Holiday | HolidayData | null) {
    const data: HolidayData | null | undefined = obj instanceof Holiday ? obj.data : obj;
    if (data) {
      this.form.patchValue({
        weekly_from: data.weekly_from ? TuiTime.fromString(data.weekly_from) : null,
        weekly_to: data.weekly_to ? TuiTime.fromString(data.weekly_to) : null,
        weekday: data.weekday ?? null,
        message: data.translations?.message ?? {},
        wholeDay: Holiday.wholeDay({weekly_from: data.weekly_from, weekly_to: data.weekly_to}),
      });
    }
    else {
      this.form.reset(this.formDefaultValue);
    }
  }

  protected formatOutput(): WeeklyHolidayOutput | null {
    if (this.form.invalid) return null;

    const { weekly_from, weekly_to, weekday } = this.form.value as { weekly_from: TuiTime | null, weekly_to: TuiTime | null, weekday: number | null };

    let weekly_to_str: string | null = null;
    let weekly_from_str: string | null = null;
    if (this.wholeDay.value === true) {
      weekly_from_str = '00:00';
      weekly_to_str = '23:59';
    } else {
      if (weekly_from) weekly_from_str = weekly_from.hours + ':' + weekly_from.minutes;
      if (weekly_to) weekly_to_str = weekly_to.hours + ':' + weekly_to.minutes;
    }

    if (!weekly_from_str || !weekly_to_str || !(typeof weekday == "number")) return null;

    const message = this.message.value;
    if (!message) return null;

    return {
      weekday: weekday, // must be set
      weekly_from: weekly_from_str,
      weekly_to: weekly_to_str,
      message: message,
    };
  }
}