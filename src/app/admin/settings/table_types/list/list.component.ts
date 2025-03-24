import { DatePipe, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { SearchResult } from '@core/lib/search-result.model';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiTablePagination, TuiTablePaginationModule } from '@taiga-ui/addon-table';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { TuiLinkModule, TuiButtonModule } from '@taiga-ui/core';
import { takeUntil, filter, finalize } from 'rxjs';
import { WeekdayPipe } from "../../../../../core/pipes/weekday.pipe";
import { ShowTranslationsComponent } from "../../../../../core/components/show-translations/show-translations.component";
import { TableType } from '@core/models/table-type';
import { TableTypesService } from '@core/services/http/table-types.service';
import { ShowImagesComponent } from "../../../../../core/components/show-images/show-images.component";

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    MatIconModule,
    RouterModule,
    TuiTablePaginationModule,
    TuiLinkModule,
    TuiLinkModule,
    TuiButtonModule,
    ShowImagesComponent
  ],
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ],
})
export class ListComponent implements OnInit {
  readonly loading: WritableSignal<boolean> = signal(false);
  readonly data: WritableSignal<SearchResult<TableType> | null> = signal(null);
  readonly items: Signal<TableType[]> = computed(() => this.data()?.items || []);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);
  private readonly service: TableTypesService = inject(TableTypesService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  readonly _ = inject(Title).setTitle($localize`Tiplogie di tavoli | La Porta D'Acqua`);

  readonly inputSize: "s" | "m" | "l" = 'm';

  filters: Record<string, string | number | boolean> = {};

  ngOnInit(): void {
    this.search();

    this.router.events.pipe(
      takeUntil(this.destroy$),
      filter((event: unknown): event is NavigationEnd => event instanceof NavigationEnd),
    ).subscribe({
      next: () => this.search()
    })
  }

  paginationChange($event: TuiTablePagination) {
    this.filters["page"] = $event.page;
    this.filters["per_page"] = $event.size;

    this.search();
  }

  delete(itemId: number | undefined): void {
    if (!(itemId)) return;

    this.notifications.confirm($localize`Sei sicuro di voler cancellare questa tipologia di tavolo?`).subscribe({
      next: (confirmed: boolean): void => {
        if (confirmed) this.confirmedDelete(itemId);
      }
    });
  }

  filtersChanged(filters: Record<string, string | boolean | number>): void {
    this.filters = filters;
    this.search(filters);
  }

  private confirmedDelete(id: number): void {
    this.loading.set(true);
    this.service.destroy(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loading.set(false);
        this.search();
      }),
    ).subscribe({
      error: (error: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(error) || $localize`Qualcosa è andato storto nella cancellazione.`);
      }
    })
  }

  private search(filters: Record<string, number | boolean | string> = this.filters): void {
    filters ||= {};
    filters = {...filters};

    this.loading.set(true);
    this.service.search(filters).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (result: SearchResult<TableType>) => {
        this.data.set(result);
      },
      error: (error: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(error) || $localize`Qualcosa è andato storto nella ricerca.`);
        console.error(error);
      }
    });
  }
}
