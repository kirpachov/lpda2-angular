import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  OnInit,
  Signal,
  signal, ViewChild,
  WritableSignal
} from '@angular/core';
import {CommonModule, DatePipe} from "@angular/common";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {TuiInputModule} from "@taiga-ui/kit";
import {TuiAutoFocusModule, TuiDay, TuiDestroyService} from "@taiga-ui/cdk";
import {TuiButtonModule, TuiDialogService, TuiExpandModule, TuiHintModule, TuiLinkModule, TuiLoaderModule} from "@taiga-ui/core";
import {MatIcon} from "@angular/material/icon";
import {NavigationEnd, Router, RouterLink, RouterModule, RouterOutlet} from "@angular/router";
import {ShowImageComponent} from "@core/components/show-image/show-image.component";
import {TuiTablePagination, TuiTablePaginationModule} from "@taiga-ui/addon-table";
import {SearchResult} from "@core/lib/search-result.model";
import {NotificationsService} from "@core/services/notifications.service";
import {
  debounceTime,
  delay,
  filter,
  finalize,
  map,
  merge,
  Observable,
  Subject,
  Subscription,
  takeUntil,
  tap
} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {nue} from "@core/lib/nue";
import {HttpErrorResponse} from "@angular/common/http";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {Reservation} from "@core/models/reservation";
import {ReservationsService} from "@core/services/http/reservations.service";
import {
  ReservationStatusSelectComponent
} from "@core/components/reservation-status-select/reservation-status-select.component";

import {
  ReservationDateSelectComponent
} from "@core/components/reservation-date-select/reservation-date-select.component";
import {ReservationTurn} from "@core/models/reservation-turn";
import {
  ReservationTurnSelectComponent
} from "@core/components/dynamic-selects/reservation-turn-select/reservation-turn-select.component";
import {
  ListReservationsFiltersComponent, ReservationsFilters
} from "@core/components/list-reservations-filters/list-reservations-filters.component";
import {ReservationEventsComponent} from "@core/components/reservation-events/reservation-events.component";
import {PhoneToComponent} from "@core/components/phone-to/phone-to.component";
import {MailToComponent} from "@core/components/mail-to/mail-to.component";
import {ReservationPeopleComponent} from "@core/components/reservation-people/reservation-people.component";
import { Title } from '@angular/platform-browser';
import { NoItemsComponent } from "../../../../core/components/no-items/no-items.component";
import { AdminReservationPaymentComponent } from "../../../../core/components/admin-reservation-payment/admin-reservation-payment.component";
import { EipReservationStatusComponent } from "../../../../core/components/eip-reservation-status/eip-reservation-status.component";
import { ReservationStatus, ReservationStatusTranslations } from '@core/lib/interfaces/reservation-data';
import { ReservationTablesSummaryComponent } from "../../../../core/components/reservation-tables-summary/reservation-tables-summary.component";
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { EditReservationTableModalComponent } from '@core/components/edit-reservation-table-modal/edit-reservation-table-modal.component';
import { PaymentStatusColorPipe } from "../../../../core/pipes/payment-status-color.pipe";
import { ReservationsEventsNotifier } from '@core/services/reservations-events-notifier';
import { AdminListReservationsComponent } from "../../../../core/components/admin-list-reservations/admin-list-reservations.component";

@Component({
  selector: 'app-admin-reservations-home',
  standalone: true,
  imports: [
    ListReservationsFiltersComponent,
    AdminListReservationsComponent,
    ReservationTablesSummaryComponent,
    RouterModule,
    TuiLoaderModule,
],
  templateUrl: './admin-reservations-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ],
})
export class AdminReservationsHomeComponent {
  readonly _ = inject(Title).setTitle($localize`Prenotazioni | La Porta D'Acqua`);

  filters: Partial<ReservationsFilters> = {};

  filtersChanged(filters: Partial<ReservationsFilters>): void {
    this.filters = {...filters};
  }
}
