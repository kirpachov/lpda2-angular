import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PublicReservationsService } from '@core/services/http/public-reservations.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiLoaderModule } from '@taiga-ui/core';
import { finalize, takeUntil } from 'rxjs';
import { ContactUsComponent } from "../../../core/components/contact-us/contact-us.component";

@Component({
  selector: 'app-legacy-delete-reservation',
  standalone: true,
  imports: [
    ContactUsComponent
],
  template: `
    <h1 i18n>Si è verificato un errore</h1>
    <app-contact-us>
      <ng-container i18n>Contattaci</ng-container>
    </app-contact-us>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class LegacyDeleteReservationComponent {
}
