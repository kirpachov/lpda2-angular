import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomValidators } from '@core/lib/custom-validators';
import { HolidayData } from '@core/lib/interfaces/holiday-data';
import { isoStringToTuiDay, stringToTuiDay, stringToTuiTime } from '@core/lib/tui-datetime-to-iso-string';
import { Holiday } from '@core/models/holiday';
import { TuiAutoFocusModule, TuiDay, TuiDayRange, TuiDestroyService, TuiTime } from '@taiga-ui/cdk';
import { from } from 'rxjs';
import { ErrorsComponent } from "../../errors/errors.component";
import { TuiButtonModule, TuiDropdownModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import {TuiInputDateRangeModule, TuiInputTimeModule} from '@taiga-ui/kit';
import { JsonPipe } from '@angular/common';
import { I18nInputComponent } from '@core/components/i18n-input/i18n-input.component';


type HolidayOutputFormat = {
  from_timestamp: string;
  to_timestamp: string;
  message: Record<string, string> | null;
}

@Component({
  selector: 'app-once-holiday-form',
  standalone: true,
  imports: [
    ErrorsComponent,
    TuiButtonModule,
    ReactiveFormsModule,
    TuiInputDateRangeModule,
    TuiAutoFocusModule,
    TuiTextfieldControllerModule,
    TuiDropdownModule,
    I18nInputComponent,
    TuiInputTimeModule,
  ],
  templateUrl: './once-holiday-form.component.html',
  providers: [
    TuiDestroyService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnceHolidayFormComponent {

  readonly today: TuiDay = TuiDay.currentLocal();

  @Output() submitEvent = new EventEmitter<HolidayOutputFormat>();
  @Output() cancelEvent: EventEmitter<void> = new EventEmitter<void>();

  private readonly defaultFromTime = new TuiTime(0, 0);
  private readonly defaultToTime = new TuiTime(23, 59);

  readonly dates: FormControl<TuiDayRange | null> = new FormControl<TuiDayRange | null>(null, [Validators.required]);
  readonly fromTime = new FormControl<TuiTime>(this.defaultFromTime, [Validators.required]);
  readonly toTime = new FormControl<TuiTime>(this.defaultToTime, [Validators.required]);
  readonly message: FormControl<Record<string, string> | null> = new FormControl<Record<string, string> | null>(null, []);

  readonly submitted: WritableSignal<boolean> = signal(false);

  readonly form: FormGroup = new FormGroup({
    fromTime: this.fromTime,
    toTime: this.toTime,
    dates: this.dates,
    message: this.message,
  });

  protected readonly formDefaultValue = this.form.value;

  submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const v = this.formatOutput();
    if (!v) return console.warn(`Invalid form value`, this.form.value);

    this.submitEvent.emit(v);
  }

  cancel() {
    this.cancelEvent.emit();
  }

  @Input() set holiday(obj: Holiday | HolidayData | null) {
    const data: HolidayData | null | undefined = obj instanceof Holiday ? obj.data : obj;
    if (data) {
      const newFormVal: {
        dates: TuiDayRange | null,
        message: Record<string, string> | null,
        fromTime: TuiTime,
        toTime: TuiTime,
      } = {
        dates: null,
        message: obj?.translations?.message || null,
        fromTime: this.defaultFromTime,
        toTime: this.defaultToTime,
      };

      const fromTimestamp: TuiDay | null = data.from_timestamp ? stringToTuiDay(data.from_timestamp) : null;
      const toTimestamp: TuiDay | null = data.to_timestamp ? stringToTuiDay(data.to_timestamp) : null;

      const fromTime: TuiTime | null = data.from_timestamp ? stringToTuiTime(data.from_timestamp) : null;
      const toTime: TuiTime | null = data.to_timestamp ? stringToTuiTime(data.to_timestamp) : null;

      if (fromTime) newFormVal["fromTime"] = fromTime;
      if (toTime) newFormVal["toTime"] = toTime;

      if (fromTimestamp && toTimestamp) {
        newFormVal["dates"] = new TuiDayRange(fromTimestamp, toTimestamp)
      }

      this.form.patchValue(newFormVal);
    }
    else {
      this.form.reset(this.formDefaultValue);
    }
  }

  protected formatOutput(): HolidayOutputFormat | null {
    if (this.form.invalid) return null;

    const v = this.form.value;
    if (!v) return null;
    const dates = v["dates"];
    if (!dates) return null;

    const fromTimestamp: TuiDay | null | undefined = dates.from;
    const toTimestamp: TuiDay | null | undefined = dates.to;

    if (!fromTimestamp || !toTimestamp) return null;

    if (!(fromTimestamp instanceof TuiDay) || !(toTimestamp instanceof TuiDay)) throw new Error('Invalid TuiDay object');

    const fromDate: string = fromTimestamp.toString(`YMD`);
    const toDate: string = toTimestamp.toString(`YMD`);

    const fromTime: string = this.fromTime.value?.toString(`HH:MM`) || '';
    const toTime: string = this.toTime.value?.toString(`HH:MM`) || '';

    const message = v["message"];

    return { from_timestamp: `${fromDate} ${fromTime}`, to_timestamp: `${toDate} ${toTime}`, message };
  }

}
