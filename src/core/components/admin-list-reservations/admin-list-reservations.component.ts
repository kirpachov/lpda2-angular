import { ChangeDetectionStrategy, Component, computed, EventEmitter, inject, Injector, Input, OnChanges, OnInit, Output, signal, Signal, ViewChild, WritableSignal } from '@angular/core';
import { ReservationPeopleComponent } from "../reservation-people/reservation-people.component";
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { PaymentStatusColorPipe } from '@core/pipes/payment-status-color.pipe';
import { TuiTablePaginationModule } from '@taiga-ui/addon-table';
import { TuiAutoFocusModule, TuiDestroyService } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiLinkModule, TuiHintModule, TuiLoaderModule, TuiExpandModule, TuiDialogService } from '@taiga-ui/core';
import { TuiInputModule } from '@taiga-ui/kit';
import { AdminReservationPaymentComponent } from '../admin-reservation-payment/admin-reservation-payment.component';
import { EipReservationStatusComponent } from '../eip-reservation-status/eip-reservation-status.component';
import { ListReservationsFiltersComponent, ReservationsFilters } from '../list-reservations-filters/list-reservations-filters.component';
import { MailToComponent } from '../mail-to/mail-to.component';
import { NoItemsComponent } from '../no-items/no-items.component';
import { PhoneToComponent } from '../phone-to/phone-to.component';
import { ReservationEventsComponent } from '../reservation-events/reservation-events.component';
import { ReservationTablesSummaryComponent } from '../reservation-tables-summary/reservation-tables-summary.component';
import { required } from 'joi';
import { Reservation } from '@core/models/reservation';
import { ReservationStatus, ReservationStatusTranslations } from '@core/lib/interfaces/reservation-data';
import { HttpErrorResponse } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { SearchResult } from '@core/lib/search-result.model';
import { ReservationsService } from '@core/services/http/reservations.service';
import { NotificationsService } from '@core/services/notifications.service';
import { ReservationsEventsNotifier } from '@core/services/reservations-events-notifier';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { takeUntil, finalize, Subscription } from 'rxjs';
import { ReservationTurnSelectComponent } from '../dynamic-selects/reservation-turn-select/reservation-turn-select.component';
import { EditReservationTableModalComponent } from '../edit-reservation-table-modal/edit-reservation-table-modal.component';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';

@Component({
  selector: 'app-admin-list-reservations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiInputModule,
    TuiAutoFocusModule,
    TuiButtonModule,
    MatIcon,
    RouterLink,
    TuiLinkModule,
    TuiTablePaginationModule,
    TuiHintModule,
    ReservationEventsComponent,
    PhoneToComponent,
    MailToComponent,
    ReservationPeopleComponent,
    NoItemsComponent,
    TuiLoaderModule,
    AdminReservationPaymentComponent,
    FormsModule,
    EipReservationStatusComponent,
    TuiExpandModule,
    PaymentStatusColorPipe,
  ],
  templateUrl: './admin-list-reservations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ],
})
export class AdminListReservationsComponent implements OnInit, OnChanges {
  readonly loading: WritableSignal<boolean> = signal(false);
  readonly data: WritableSignal<SearchResult<Reservation> | null> = signal(null);
  readonly items: Signal<Reservation[]> = computed(() => this.data()?.items || []);

  private readonly dialogs: TuiDialogService = inject(TuiDialogService);
  private readonly injector: Injector = inject(Injector);
  private readonly service: ReservationsService = inject(ReservationsService);
  private readonly router = inject(Router);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly reservationsEvents: ReservationsEventsNotifier = inject(ReservationsEventsNotifier);

  readonly showFullDate: WritableSignal<boolean> = signal(false);

  @Input() set filters(filters: Partial<ReservationsFilters>) {
    this._filters = filters;
    this.filtersChanged()
  }

  get filters(): Partial<ReservationsFilters> {
    return this._filters;
  }

  private _filters: Partial<ReservationsFilters> = {};

  ngOnInit(): void {
    this.reservationsEvents.listenWsChanges().subscribe({
      next: () => this.search(),
    });

    this.router.events.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (e: unknown) => {
        if (e instanceof NavigationEnd) this.search();
      }
    });

    this.search();
  }

  ngOnChanges(): void {
    this.search();
  }

  export(): void {
    this.loading.set(true);
    this.service.export(this.filters).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      error: (h: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(h) || SOMETHING_WENT_WRONG_MESSAGE);
      }
    });
  }

  updateStatus(item: Reservation, status: ReservationStatus): void {
    const id = item.id;
    if (!(id && status)) {
      this.notifications.error();
      return;
    }

    this.notifications.confirm(`La prenotazione verrà aggiornata.`, { title: $localize`Prenotazione ${item.fullname} x ${(item.adults || 0) + (item.children || 0)} in stato ${ReservationStatusTranslations[status].title}` }).subscribe({
      next: (confirmed: boolean): void => {
        if (confirmed) {
          this.confirmedUpdateStatus(id, status);
        }
      }
    });
  }

  delete(reservationId: number | undefined): void {
    if (!(reservationId)) return;

    this.notifications.confirm($localize`Sei sicuro di voler cancellare questa prenotazione?`).subscribe({
      next: (confirmed: boolean): void => {
        if (confirmed) this.confirmedDelete(reservationId);
      }
    });
  }

  private filtersChanged(): void {
    // this.filters = filters;
    // this.search(filters);
    this.showFullDate.set(this.filters.date_from !== this.filters.date_to);
  }

  editTable(reservation: Reservation) {
    this.dialogs.open<string | false | null>(
      new PolymorpheusComponent(EditReservationTableModalComponent, this.injector),
      {
        data: {
          item: reservation
        }
      }
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result: string | null | false): void => {
        // console.log(`result`, {result});
        if (result != false && reservation.id) {
          this.loading.set(true);
          this.service.update(reservation.id, { table: result }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading.set(false)),
            finalize(() => this.search()),
          ).subscribe();
        }
      },
      error: (error: any): void => console.error(error),
    })
  }

  private confirmedUpdateStatus(id: number, status: ReservationStatus): void {
    this.loading.set(true);
    const req = status == "deleted" ? this.service.destroy(id) : this.service.updateStatus(id, status);

    req.pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => {
        this.notifications.fireSnackBar($localize`Stato aggiornato con successo.`);
        this.search();
      },
      error: (error: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(error) || $localize`Qualcosa è andato storto nell'aggiornamento dello stato.`);
      }
    });
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

  private searchSub?: Subscription | null = null;
  private search(filters: Partial<ReservationsFilters> = this.filters): void {
    filters ||= {};
    filters = { ...filters };

    this.searchSub?.unsubscribe();

    this.loading.set(true);
    this.searchSub = this.service.search(filters).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (result: SearchResult<Reservation>) => {
        this.data.set(result);
      },
      error: (error: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(error) || $localize`Qualcosa è andato storto nella ricerca.`);
        console.error(error);
      }
    });
  }
}
