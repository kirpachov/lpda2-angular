import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, inject, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TuiDestroyService, TuiDayRange } from '@taiga-ui/cdk';
import { TuiDataListModule, TuiPrimitiveTextfieldModule, TuiSizeL, TuiSizeS, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TuiDataListWrapperModule, TuiInputNumberModule, TuiSelectModule } from '@taiga-ui/kit';
import { takeUntil } from 'rxjs';
import { tuiInputNumberOptionsProvider } from '@taiga-ui/kit';
import { CommonTranslatePipe } from '@core/pipes/common-translate.pipe';

export const MeasureOptions = [
  "minutes",
  "hours",
  "days",
  "weeks",
] as const;

export type Measure = typeof MeasureOptions[number];

@Component({
  selector: 'app-duration-input',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiInputNumberModule,
    TuiTextfieldControllerModule,
    TuiDataListModule,
    TuiSelectModule,
    TuiDataListWrapperModule,
    CommonTranslatePipe,
    TuiPrimitiveTextfieldModule,
  ],
  templateUrl: './duration-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DurationInputComponent),
      multi: true
    },

    TuiDestroyService
  ]
})
export class DurationInputComponent implements OnInit, ControlValueAccessor {
  private readonly destroy$ = inject(TuiDestroyService)

  @Input()
  measureOptions: Measure[] = [
    "minutes",
    "hours",
    "days",
    "weeks",
  ];

  @Input({ required: true }) outputMeasure: Measure = "minutes";
  @Input({ required: true }) inputMeasure: Measure = "minutes";

  readonly number: FormControl<number | null> = new FormControl<number | null>(null);
  readonly measure: FormControl<string | null> = new FormControl<Measure | null>("minutes");

  readonly output: EventEmitter<number | null> = new EventEmitter<number | null>();

  @Input() inputSize: TuiSizeS | TuiSizeL = "m";

  ngOnInit(): void {
    this.number.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.output.emit(this.transformOutput());
    }
    );

    this.measure.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.output.emit(this.transformOutput());
    }
    );
  }

  writeValue(obj: unknown): void {
    let value: number | null = null;
    if (typeof obj === "string" && obj.match(/^\d+$/)) {
      value = Number(obj);
    } else if (typeof obj === "number") {
      value = obj;
    } else if (obj != null && obj !== undefined)
      console.warn('Invalid value for DurationInputComponent', obj);

    const [number, measure] = this.formatInput(value);

    this.number.setValue(number, { emitEvent: false });
    this.measure.setValue(measure, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.output.pipe(
      takeUntil(this.destroy$),
    ).subscribe((data) => fn(data));
  }

  registerOnTouched(fn: any): void {
    this.output.pipe(
      takeUntil(this.destroy$),
    ).subscribe((data) => fn(data));
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.number.disable();
      this.measure.disable();
    } else {
      this.number.enable();
      this.measure.enable();
    }
  }

  private formatInput(value: number | null): [number, Measure] {
    if (value === null || value == 0) return [0, "minutes"];

    value = this.fromMeasureToMinutes(value, this.inputMeasure);

    const measure = this.detectMeasure(value);
    return [
      this.fromMinutesToMeasure(value, measure),
      measure
    ];
  }

  private transformOutput(value: number | null = this.number.value): number | null {
    const done = (value: number | null) => value ? this.fromMinutesToOutputMeasure(value) : null;

    if (value === null) return done(null);

    if (this.measure.value === "minutes") return done(value);
    if (this.measure.value === "hours") return done(value * 60);
    if (this.measure.value === "days") return done(value * 60 * 24);
    if (this.measure.value === "weeks") return done(value * 60 * 24 * 7);

    throw new Error(`Invalid measure: ${this.measure.value}`);
  }

  private detectMeasure(value: number): Measure {
    if (value % (60 * 24 * 7) === 0) return "weeks";
    if (value % (60 * 24) === 0) return "days";
    if (value % 60 === 0) return "hours";
    return "minutes";
  }

  private fromMinutesToOutputMeasure(value: number): number {
    return this.fromMinutesToMeasure(value, this.outputMeasure);
  }

  private fromMinutesToMeasure(value: number, measure: Measure): number {
    if (measure === "minutes") return value;
    if (measure === "hours") return value / 60;
    if (measure === "days") return value / 60 / 24;
    if (measure === "weeks") return value / 60 / 24 / 7;

    throw new Error(`Invalid measure: ${measure}`);
  }

  private fromMeasureToMinutes(value: number, measure: Measure): number {
    if (measure === "minutes") return value;
    if (measure === "hours") return value * 60;
    if (measure === "days") return value * 60 * 24;
    if (measure === "weeks") return value * 60 * 24 * 7;

    throw new Error(`Invalid measure: ${measure}`);
  }
}
