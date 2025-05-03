import {ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {Reservation} from "@core/models/reservation";
import {DatePipe} from "@angular/common";
import {TuiButtonModule, TuiLinkModule} from "@taiga-ui/core";
import {NotificationsService} from "@core/services/notifications.service";
import {ReservationsService} from "@core/services/http/reservations.service";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {LocalStorageService} from "@core/services/local-storage.service";
import {PublicReservationsService} from "@core/services/http/public-reservations.service";
import {PublicMessageComponent} from "@core/components/public-message/public-message.component";
import {RouterLink} from "@angular/router";
import {HttpErrorResponse} from "@angular/common/http";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {SOMETHING_WENT_WRONG_MESSAGE} from "@core/lib/something-went-wrong-message";
import {finalize, takeUntil} from "rxjs";
import {ContactUsComponent} from "@core/components/contact-us/contact-us.component";
import { PublicReservationConfirmationComponent } from "../public-reservation-confirmation/public-reservation-confirmation.component";
import { PublicReservationFormv2Component } from "../public-reservation-form-v2/public-reservation-formv2/public-reservation-formv2.component";


@Component({
  selector: 'app-public-home-reservev2',
  standalone: true,
  imports: [
    TuiButtonModule,
    PublicMessageComponent,
    TuiLinkModule,
    PublicReservationConfirmationComponent,
    PublicReservationFormv2Component
],
  templateUrl: './public-home-reservev2.component.html',
  styleUrl: './public-home-reservev2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class PublicHomeReserveV2Component implements OnInit {
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly reservations: PublicReservationsService = inject(PublicReservationsService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly localStorage: LocalStorageService = inject(LocalStorageService);

  readonly createdReservation: WritableSignal<Reservation | null> = signal(null);
  readonly resendingConfirmation: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.reservations.created.pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: (reservation: Reservation | null): void => {
        this.createdReservation.set(reservation);
      }
    })
  }
}