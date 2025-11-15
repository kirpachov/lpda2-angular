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
import { TuiAccordionModule, TuiDataListWrapperModule, TuiInputModule, TuiInputNumberModule, TuiMultiSelectModule, TuiSelectModule } from "@taiga-ui/kit";
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
import { ReservationPaymentPreorderType, ReservationPaymentStatus } from '@core/lib/interfaces/reservation-payment-data';
import { PreorderReservationGroupPreorderTypeComponent } from '../preorder-reservation-group-preorder-type/preorder-reservation-group-preorder-type.component';
import { PreorderType } from '@core/lib/interfaces/preorder-reservation-group-data';
import { TableType } from '@core/models/table-type';
import { TableTypeSelectComponent } from '../dynamic-selects/table-type-select/table-type-select.component';
import { SelectPaymentStatusComponent } from "../select-payment-status/select-payment-status.component";
import { PaymentStatusComponent } from "../payment-status/payment-status.component";
import { SelectPreorderTypeComponent } from "../select-preorder-type/select-preorder-type.component";
import { ReservationPaymentPreorderTypeComponent } from "../reservation-payment-preorder-type/reservation-payment-preorder-type.component";
import { SelectReservationPaymentPreorderTypeComponent } from "../select-reservation-payment-preorder-type/select-reservation-payment-preorder-type.component";
// import { FilterTableTypeInputComponent } from '../filter-table-type-input/filter-table-type-input.component';

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

  /**
   * comma-separated list of table type ids
   */
  table_types: string;

  payment_status: ReservationPaymentStatus;
  preorder_type: ReservationPaymentPreorderType;
  payment_external_id: string;

  people_more_than: number; // >=
  people_less_than: number; // <=
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
    TuiMultiSelectModule,
    TableTypeSelectComponent,
    SelectPaymentStatusComponent,
    PaymentStatusComponent,
    SelectPreorderTypeComponent,
    TuiAccordionModule,
    // PreorderReservationGroupPreorderTypeComponent,
    ReservationPaymentPreorderTypeComponent,
    SelectReservationPaymentPreorderTypeComponent,
    TuiInputNumberModule,
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

    /**
     * Filtering by reservations payment status
     */
    payment_status: new FormControl<ReservationPaymentStatus | null>(null),

    /**
     * If payment is preorder or actual payment.
     */
    preorder_type: new FormControl<ReservationPaymentPreorderType | null>(null),

    /**
     * Providers id.
     */
    payment_external_id: new FormControl<string | null>(null),

    table_type: new FormControl<TableType | null>(null),

    /**
     * Tables where children + adults >= x
     */
    people_more_than: new FormControl<number | null>(null),

    /**
     * Tables where children + adults <= x
     */
    people_less_than: new FormControl<number | null>(null),
  });

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
      this.orderBy,
      this.hiddenFormGroup.controls.table_type,
      this.hiddenFormGroup.controls.payment_status,
      this.hiddenFormGroup.controls.preorder_type,
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
      this.query,
      this.hiddenFormGroup.controls.payment_external_id,
      this.hiddenFormGroup.controls.people_more_than,
      this.hiddenFormGroup.controls.people_less_than,
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
      per_page: this.per_page,
      // table_types: this.hiddenFormGroup.controls.table_types.value,
    };

    if (this.hiddenFormGroup.controls.table_type.value && this.hiddenFormGroup.controls.table_type.value.id) {
      filters["table_types"] = this.hiddenFormGroup.controls.table_type.value.id.toString();
    }


    if (this.hiddenFormGroup.controls.payment_status.value && this.hiddenFormGroup.controls.payment_status.value) {
      filters["payment_status"] = this.hiddenFormGroup.controls.payment_status.value;
    }

    if (this.hiddenFormGroup.controls.preorder_type.value && this.hiddenFormGroup.controls.preorder_type.value) {
      filters["preorder_type"] = this.hiddenFormGroup.controls.preorder_type.value;
    }

    if (this.hiddenFormGroup.controls.payment_external_id.value && this.hiddenFormGroup.controls.payment_external_id.value) {
      filters["payment_external_id"] = this.hiddenFormGroup.controls.payment_external_id.value;
    }

    if (this.hiddenFormGroup.controls.people_more_than.value && this.hiddenFormGroup.controls.people_more_than.value) {
      filters["people_more_than"] = Number(this.hiddenFormGroup.controls.people_more_than.value);
    }

    if (this.hiddenFormGroup.controls.people_less_than.value && this.hiddenFormGroup.controls.people_less_than.value) {
      filters["people_less_than"] = Number(this.hiddenFormGroup.controls.people_less_than.value);
    }

    if (typeof this.query.value == 'string' && this.query.valid && this.query.value.length > 0) {
      filters['query'] = this.query.value;
    }

    if (this.date.value instanceof TuiDayRange && this.date.valid) {
      // const from: string | null = this.datePipe.transform(this.date.value.from.toString("YMD"), 'YYYY-MM-dd');
      // const to: string | null = this.datePipe.transform(this.date.value.to.toUtcNativeDate(), 'YYYY-MM-dd');

      const from: string | null = this.date.value.from.toString("YMD", "-")
      const to: string | null = this.date.value.to.toString("YMD", "-");

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
