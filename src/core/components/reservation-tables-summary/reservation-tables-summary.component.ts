import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  OnChanges,
  Signal,
  signal,
  WritableSignal
} from '@angular/core';
import {TuiDay, TuiDestroyService, TuiLetModule} from "@taiga-ui/cdk";
import {ReservationsService} from "@core/services/http/reservations.service";
import {finalize, takeUntil} from "rxjs";
import {TuiHintModule, TuiLoaderModule} from "@taiga-ui/core";
import {addMissingTableSizes, adjustSummaries, ReservationTableSummary, UngroupedTablesSummary} from "@core/lib/interfaces/reservation-table-summary";
import {ObjectToArrayPipe} from "@core/pipes/object-to-array.pipe";
import { ReservationsFilters } from '../list-reservations-filters/list-reservations-filters.component';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-reservation-tables-summary',
  standalone: true,
  imports: [
    TuiLoaderModule,
    TuiHintModule,
    MatIconModule,
    ObjectToArrayPipe,
    NgClass,
],
  templateUrl: './reservation-tables-summary.component.html',
  styleUrls: ['./reservation-tables-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class ReservationTablesSummaryComponent implements OnChanges {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly service: ReservationsService = inject(ReservationsService);

  // First number is the size of the table, second number is the number of tables with that size.
  readonly ungroupedData: WritableSignal<[number, number][] | null> = signal<[number, number][] | null>(null);

  readonly totalPeople = computed(() => this.ungroupedData()?.reduce((acc, [size, count]) => acc + size * count, 0) || 0);

  readonly groupedData: WritableSignal<ReservationTableSummary[] | null> = signal<ReservationTableSummary[] | null>(null);

  readonly loadingGrouped: WritableSignal<boolean> = signal<boolean>(false);
  readonly loadingUngrouped: WritableSignal<boolean> = signal<boolean>(false);
  readonly parentLoading: WritableSignal<boolean> = signal<boolean>(false);
  readonly loading = computed(() => this.loadingGrouped() || this.loadingUngrouped() || this.parentLoading());

  readonly groupedError: WritableSignal<string | null> = signal<string | null>(null);

  @Input() set showLoader(value: boolean) {
    this.parentLoading.set(value);
  }

  get showLoader(): boolean {
    return this.parentLoading();
  }

  @Input() filters: Record<string, string | number | TuiDay | boolean> | null = null;

  ngOnChanges(): void {
    this.query();
  }

  private query(): void {
    this.queryUngrouped();
    this.queryGrouped();
  }

  private queryUngrouped(): void {
    this.loadingUngrouped.set(true);
    const filters: Record<string, string | number | boolean> = {};

    Object.keys(this.filters ?? {}).forEach(key => {
      if (this.filters) {
        const value: TuiDay | string | number | boolean | null | undefined = this.filters[key];
        if (value instanceof TuiDay) {
          filters[key] = value.toString();
        } else if (value) { // TODO what if value = 0
          filters[key] = value;
        }
      }
    });

    this.service.ungroupedTablesSummary(filters).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingUngrouped.set(false)),
    ).subscribe({
      next: (data: UngroupedTablesSummary): void => {
        this.ungroupedData.set(Object.entries(data).map(([size, count]) => [Number(size), count]));
      }
    })
  }

  private queryGrouped(): void {
    this.groupedError.set(null);
    this.groupedData.set(null);

    const filters: Partial<{date: string}> = {};

    if (this.filters && this.filters["date_from"] && this.filters["date_from"] === this.filters["date_to"]) {
      filters["date"] = this.filters["date_from"].toString();
    } else if (this.filters && this.filters["date"] instanceof TuiDay) {
      filters["date"] = this.filters["date"].toString();
    } else {
      console.warn(`invalid filters for grouped data`, this.filters, JSON.stringify(this.filters));
      this.groupedError.set($localize`Seleziona un unico giorno per vedere il riepilogo raggruppato per turno.`);
      return;
    }

    this.loadingGrouped.set(true);
    this.service.tablesSummary(filters).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingGrouped.set(false)),
    ).subscribe({
      next: (data: ReservationTableSummary[]): void => {
        this.groupedData.set(adjustSummaries(data));
      }
    })
  }
}
