import { DatePipe, JsonPipe } from '@angular/common';
import { Component, EventEmitter, Inject, inject, Output, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicData } from '@core/lib/interfaces/public-data';
import { SettingValue } from '@core/lib/settings';
import { PublicPagesDataService } from '@core/services/http/public-pages-data.service';
import { PublicReservationsService } from '@core/services/http/public-reservations.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiContextWithImplicit, TuiDay, TuiDestroyService } from '@taiga-ui/cdk';
import { takeUntil, filter } from 'rxjs';
import { ErrorsComponent } from "../../errors/errors.component";
import { TuiButtonModule, TuiCalendarModule, TuiDataListModule, TuiGroupModule, TuiHostedDropdownModule, TuiPrimitiveTextfieldModule, TuiSizeL, TuiSizeM, TuiSizeS, TuiSvgModule, TuiTextfieldControllerModule, TuiWrapperModule } from '@taiga-ui/core';
import { MatIconModule } from '@angular/material/icon';
import { TUI_ARROW, TUI_ARROW_MODE, TUI_ARROW_OPTIONS, TuiArrowMode, TuiArrowModule, TuiArrowOptions, TuiDataListWrapperModule, TuiInputDateModule, TuiSelectModule } from '@taiga-ui/kit';
import { PolymorpheusContent, PolymorpheusModule } from '@tinkoff/ng-polymorpheus';

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
  ],
  templateUrl: './public-reserve-preview.component.html',
  styleUrl: './public-reserve-preview.component.scss',
  providers: [
    TuiDestroyService,
  ]
})
export class PublicReservePreviewComponent {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly reservations: PublicReservationsService = inject(PublicReservationsService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly publicDataService: PublicPagesDataService = inject(PublicPagesDataService);

  @Output() submitted: EventEmitter<{ date: string, time: string, people: number }> = new EventEmitter<{ date: string, time: string, people: number }>();

  readonly maxDaysInAdvance: WritableSignal<number> = signal(300);

  // readonly maxPeople: WritableSignal<number> = signal(10);
  readonly formSubmitted: WritableSignal<boolean> = signal(false);

  readonly form = new FormGroup({
    people: new FormControl<number | null>(2, [Validators.required, Validators.min(1), Validators.max(20)]),
    date: new FormControl<TuiDay | null>(TuiDay.currentLocal(), [Validators.required]),
    time: new FormControl(null, [Validators.required]),
  });

  readonly peopleArray: WritableSignal<number[]> = signal(Array.from({ length: 10 }).map((_: unknown, i: number): number => i + 1));

  private readonly defaultDateReadonly: string = $localize`Seleziona una data`;
  readonly dateReadonly: WritableSignal<string> = signal(this.defaultDateReadonly);
  // readonly stringify = (a: string) => `content ${a}`;

  // get computedValue(): string {
  //   return `computed value ${this.form.value.date}`;
  // }

  private readonly datePipe = inject(DatePipe);

  readonly TUI_ARROW = TUI_ARROW;

  constructor(
    // @Inject(TUI_ARROW_MODE) private readonly arrowMode: TuiArrowMode,
    @Inject(TUI_ARROW_OPTIONS) private readonly options: TuiArrowOptions,
  ) { }

  ngOnInit(): void {
    this.loadPublicData();

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.formUpdated();
    });

    this.formUpdated();
  }


  // get arrow(): PolymorpheusContent<
  //   TuiContextWithImplicit<TuiSizeL | TuiSizeM | TuiSizeS>
  // > {
  //   return this.arrowMode.disabled;
  //   // return !this.interactive ? this.arrowMode.disabled : this.arrowMode.interactive;
  // }

  get arrowIcon(): PolymorpheusContent {
    // return tuiSizeBigger(this.textfieldSize.size)
    //     ? this.options.iconLarge
    //     :
        return this.options.iconLarge;
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
      }
    })
  }

  private updateMaxPeople(value: number): void {
    this.peopleArray.set(Array.from({ length: value }).map((_: unknown, i: number): number => i + 1));
  }

  private formUpdated(): void {
    this.formSubmitted.set(false);

    this.dateReadonly.set(
      this.datePipe.transform(this.form.value.date?.toLocalNativeDate(), "d MMMM") ?? this.defaultDateReadonly
    )
  }
}
