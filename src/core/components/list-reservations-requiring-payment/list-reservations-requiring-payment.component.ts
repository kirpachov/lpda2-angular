import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Injector, signal, Signal, ViewChild, WritableSignal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { SearchResult } from '@core/lib/search-result.model';
import { Reservation } from '@core/models/reservation';
import { ReservationsService } from '@core/services/http/reservations.service';
import { NotificationsService } from '@core/services/notifications.service';
import { ReservationsEventsNotifier } from '@core/services/reservations-events-notifier';
import { TuiDay, TuiDestroyService } from '@taiga-ui/cdk';
import { TuiDialogService, TuiExpandModule } from '@taiga-ui/core';
import { finalize, takeUntil } from 'rxjs';
import { ReservationTurnSelectComponent } from '../dynamic-selects/reservation-turn-select/reservation-turn-select.component';
import { ReservationsFilters } from '../list-reservations-filters/list-reservations-filters.component';
import { HttpErrorResponse } from '@angular/common/http';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { AdminListReservationsComponent } from "../admin-list-reservations/admin-list-reservations.component";

@Component({
  selector: 'app-list-reservations-requiring-payment',
  standalone: true,
  imports: [
    TuiExpandModule,
    AdminListReservationsComponent
  ],
  templateUrl: './list-reservations-requiring-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListReservationsRequiringPaymentComponent {
  readonly filters: Partial<ReservationsFilters> = {
    order_by_direction: "asc",
    order_by_field: "datetime",
    date_from: TuiDay.currentLocal().toString(),
    status: "active",
    payment_status: "todo",
    per_page: 100,
    offset: 0
  };
}
