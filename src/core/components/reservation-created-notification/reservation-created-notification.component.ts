import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Reservation } from '@core/models/reservation';
import { TuiDialog } from '@taiga-ui/cdk';
import { TuiAlertOptions, TuiLinkModule } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'app-reservation-created-notification',
  standalone: true,
  imports: [
    DatePipe,
    RouterModule,
    TuiLinkModule,
  ],
  template: `
    @if(reservation) {
      Nuova prenotazione per {{reservation.people}} persone per {{reservation.datetime | date: 'dd/MM/yyyy HH:mm'}} a nome {{reservation.fullname}}

      <a tuiLink routerLink="/admin/reservations/{{reservation.id}}">
        <ng-container i18n>Dettagli</ng-container>
      </a>
    }
`,
})
export class ReservationCreatedNotificationComponent {
  reservation: Reservation | null = null;

  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialog<TuiAlertOptions<void>, unknown>,
  ) {
    this.reservation = context.data?.["reservation"] || null;
  }
}
