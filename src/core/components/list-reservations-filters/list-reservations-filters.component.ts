import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output, signal,
  TemplateRef,
  WritableSignal
} from '@angular/core';
import { TuiButtonModule, TuiDataListModule, TuiDialogService, TuiHostedDropdownModule, TuiLinkModule, TuiTextfieldControllerModule } from "@taiga-ui/core";
import { MatIcon } from "@angular/material/icon";
import { TuiDataListWrapperModule, TuiInputModule, TuiSelectModule } from "@taiga-ui/kit";
import { TuiAutoFocusModule, TuiDay, TuiDayRange, TuiDestroyService } from "@taiga-ui/cdk";
import { RouterLink } from "@angular/router";
import {
  ReservationStatusSelectComponent
} from "@core/components/reservation-status-select/reservation-status-select.component";
import {
  ReservationTurnSelectComponent
} from "@core/components/dynamic-selects/reservation-turn-select/reservation-turn-select.component";
import {
  ReservationDateSelectComponent
} from "@core/components/reservation-date-select/reservation-date-select.component";
import { TuiTablePagination, TuiTablePaginationModule } from "@taiga-ui/addon-table";
import { Reservation } from "@core/models/reservation";
import { SearchResult } from "@core/lib/search-result.model";
import { DatePipe, JsonPipe, NgSwitch, NgSwitchCase, NgSwitchDefault } from "@angular/common";
import { ReservationTurn } from "@core/models/reservation-turn";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ReservationStatus } from "@core/lib/interfaces/reservation-data";
import { debounceTime, distinctUntilChanged, filter, Subscription, takeUntil } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { strToUTC } from "@core/lib/str-time-timezone";
import {
  ReservationTablesSummaryComponent
} from "@core/components/reservation-tables-summary/reservation-tables-summary.component";
import { ReservationStatusComponent } from "../reservation-status/reservation-status.component";
import { ChipComponent } from "../chip/chip.component";

// export type ReservationsFilters = ReservationsFiltersWithDate | ReservationsFiltersWithDatetime;

export interface ReservationsFilters {
  query: string;
  status: ReservationStatus;
  date: string;
  datetime_from: string;
  time_from: string;
  time_to: string;
  date_from: string;
  date_to: string;
  datetime_to: string;
  order_by_field: string;
  order_by_direction: "asc" | "desc";

  offset: number;
  per_page: number;
}

@Component({
  selector: 'app-list-reservations-filters',
  standalone: true,
  imports: [
    TuiButtonModule,
    MatIcon,
    TuiInputModule,
    TuiAutoFocusModule,
    TuiLinkModule,
    RouterLink,
    ReservationStatusSelectComponent,
    ReservationTurnSelectComponent,
    ReservationDateSelectComponent,
    TuiTablePaginationModule,
    ReactiveFormsModule,
    TuiHostedDropdownModule,
    TuiTextfieldControllerModule,
    ReservationStatusComponent,
    ChipComponent,
    TuiDataListWrapperModule,
    TuiSelectModule,
    TuiDataListModule,
    // NgSwitch,
    // NgSwitchCase,
    // NgSwitchDefault,
  ],
  templateUrl: './list-reservations-filters.component.html',
  providers: [
    TuiDestroyService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListReservationsFiltersComponent implements OnInit, AfterViewInit {
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);

  @Input() loading: boolean = false;
  @Input({ required: true }) data: SearchResult<Reservation> | null = null;

  @Output() readonly filtersChanged: EventEmitter<Partial<ReservationsFilters>> = new EventEmitter<Partial<ReservationsFilters>>();
  // @Output() readonly submit: EventEmitter<void> = new EventEmitter<void>();

  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly datePipe: DatePipe = inject(DatePipe);

  readonly query: FormControl<string | null> = new FormControl<string | null>(null);
  readonly turn: FormControl<ReservationTurn | null> = new FormControl<ReservationTurn | null>(null);
  readonly date: FormControl<TuiDayRange | null> = new FormControl<TuiDayRange | null>(new TuiDayRange(TuiDay.currentLocal(), TuiDay.currentLocal()));
  readonly status: FormControl<ReservationStatus | null> = new FormControl<ReservationStatus | null>(`active`);
  readonly orderBy = new FormControl<{ field: string, direction: "desc" | "asc" } | null>(null);

  readonly hiddenFormGroup = new FormGroup({
    query: this.query,
    status: this.status,
  })

  // Date formatted as string
  readonly dateStr: WritableSignal<string | null> = signal(this.formatDate(this.date.value));

  private offset: number = 0;
  private per_page: number = 100;

  readonly orderByOptions: { field: string, direction: "asc" | "desc", humanLabel: string }[] = [
    { field: 'created_at', direction: 'desc', humanLabel: $localize`Data di creazione (più recenti)` },
    { field: 'created_at', direction: 'asc', humanLabel: $localize`Data di creazione (meno recenti)` },
    { field: 'datetime', direction: 'desc', humanLabel: $localize`Data e ora (più recenti)` },
    { field: 'datetime', direction: 'asc', humanLabel: $localize`Data e ora (meno recenti)` },
  ];

  constructor() {
  }

  ngOnInit(): void {
    // Listen date change to update dateStr.
    this.date.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: (date: TuiDayRange | null): void => {
        this.turn.setValue(null);

        if (!date || !date.isSingleDay) this.turn.disable();
        else if (this.turn.disabled) this.turn.enable();

        this.dateStr.set(this.formatDate(date));
      },
      error: (error: any) => console.error(error),
    });

    // Absolute filters:
    // When changed, query again immediately.
    [
      this.date,
      this.turn,
      this.status,
      this.orderBy
    ].map((control: FormControl): void => {
      control.valueChanges.pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        filter(() => control.valid),
      ).subscribe({
        next: (): void => {
          this.offset = 0;
          this.filtersMayHaveChanged();
        },
      });
    });

    // Wait some time before querying again.
    [
      this.query
    ].map((control: FormControl): void => {
      control.valueChanges.pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        debounceTime(500),
        filter(() => control.valid),
      ).subscribe({
        next: (): void => {
          this.offset = 0;
          this.filtersMayHaveChanged();
        },
      });
    });
  }

  ngAfterViewInit(): void {
    this.emitCurrentFilters();
  }

  submit(): void {
    this.emitCurrentFilters();
  }

  mergeFilters(newFilters: Record<string, string>): void {
    // TODO:
    // from outside should be able to call this method to merge some filter
  }

  setFilters(newFilters: Record<string, string>): void {
    // TODO:
    // from outside should be able to call this method to set filters
  }

  // Calculating current filters here.
  currentFilters(): Partial<ReservationsFilters> {
    const filters: Partial<ReservationsFilters> = {
      offset: this.offset,
      per_page: this.per_page
    };

    if (typeof this.query.value == 'string' && this.query.valid && this.query.value.length > 0) {
      filters['query'] = this.query.value;
    }

    if (this.date.value instanceof TuiDayRange && this.date.valid) {
      const from: string | null = this.datePipe.transform(this.date.value.from.toUtcNativeDate(), 'YYYY-MM-dd');
      const to: string | null = this.datePipe.transform(this.date.value.to.toUtcNativeDate(), 'YYYY-MM-dd');

      if (from && to) {
        filters['date_from'] = `${from}`;
        filters['date_to'] = `${to}`;
      }
    }

    const turn: ReservationTurn | null = this.turn.value;

    if (this.turn.valid && turn instanceof ReservationTurn && turn.starts_at && turn.ends_at) {
      filters['time_from'] = `${strToUTC(turn.starts_at)}`;
      filters['time_to'] = `${strToUTC(turn.ends_at)}`;
    }

    // if (this.date.value instanceof TuiDayRange && this.date.valid) {}

    if (typeof this.status.value == 'string' && this.status.valid) {
      filters.status = this.status.value;
    }

    if (this.orderBy.valid && this.orderBy.value) {
      filters.order_by_field = this.orderBy.value.field;
      filters.order_by_direction = this.orderBy.value.direction;
    }

    return filters;
  }

  paginationChange(event: TuiTablePagination): void {
    this.offset = event.page;
    this.per_page = event.size;
    this.filtersMayHaveChanged();
  }

  private filtersSub?: Subscription;
  fireModal(temp: TemplateRef<any>) {
    this.filtersSub?.unsubscribe();

    this.filtersSub = this.dialogs.open(temp).subscribe();
  }

  closeFiltersModal() {
    this.filtersSub?.unsubscribe();
  }

  // Will check if filters changed, and if so, will emit new filters.
  // Will return a boolean indicating if filters changed.
  private lastFilters: Partial<ReservationsFilters> = {};

  private filtersMayHaveChanged(): boolean {
    const currentFilters: Partial<ReservationsFilters> = this.currentFilters();
    const changed: boolean = JSON.stringify(currentFilters) !== JSON.stringify(this.lastFilters);
    console.log(`changed`, {changed, currentFilters});
    if (changed) {
      this.lastFilters = currentFilters;
      this.emitCurrentFilters();
    }

    return changed;
  }

  private formatDate(date: TuiDayRange | null): string | null {
    if (date instanceof Date) {
      return this.datePipe.transform(date, 'YYYY-MM-dd');
    }

    if (date instanceof TuiDayRange) {
      if (date.isSingleDay) {
        return this.datePipe.transform(date.from.toUtcNativeDate(), 'YYYY-MM-dd');
      }

      return `${this.datePipe.transform(date.from.toUtcNativeDate(), 'YYYY-MM-dd')} - ${this.datePipe.transform(date.to.toUtcNativeDate(), 'YYYY-MM-dd')}`;
    }

    return null;
  }

  private emitCurrentFilters(): void {
    this.filtersChanged.emit(this.currentFilters());
  }
}
