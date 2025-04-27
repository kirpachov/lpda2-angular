import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ReservationPeopleComponent } from "../reservation-people/reservation-people.component";
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PaymentStatusColorPipe } from '@core/pipes/payment-status-color.pipe';
import { TuiTablePaginationModule } from '@taiga-ui/addon-table';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiLinkModule, TuiHintModule, TuiLoaderModule, TuiExpandModule } from '@taiga-ui/core';
import { TuiInputModule } from '@taiga-ui/kit';
import { AdminReservationPaymentComponent } from '../admin-reservation-payment/admin-reservation-payment.component';
import { EipReservationStatusComponent } from '../eip-reservation-status/eip-reservation-status.component';
import { ListReservationsFiltersComponent } from '../list-reservations-filters/list-reservations-filters.component';
import { MailToComponent } from '../mail-to/mail-to.component';
import { NoItemsComponent } from '../no-items/no-items.component';
import { PhoneToComponent } from '../phone-to/phone-to.component';
import { ReservationEventsComponent } from '../reservation-events/reservation-events.component';
import { ReservationTablesSummaryComponent } from '../reservation-tables-summary/reservation-tables-summary.component';
import { required } from 'joi';
import { Reservation } from '@core/models/reservation';
import { ReservationStatus } from '@core/lib/interfaces/reservation-data';

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
    RouterOutlet,
    TuiTablePaginationModule,
    TuiHintModule,
    ListReservationsFiltersComponent,
    ListReservationsFiltersComponent,
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
    ReservationTablesSummaryComponent,
    PaymentStatusColorPipe,
    AdminListReservationsComponent
  ],
  templateUrl: './admin-list-reservations.component.html',
  // styleUrl: './admin-list-reservations.component.scss'
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminListReservationsComponent {
  @Output() readonly editTable = new EventEmitter<Reservation>();
  @Output() readonly updateStatus = new EventEmitter<[Reservation, ReservationStatus]>();

  @Input({ required: true }) reservations: Reservation[] | null | undefined = [];
}
