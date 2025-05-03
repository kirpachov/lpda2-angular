import { ChangeDetectionStrategy, Component, inject, Input, signal, WritableSignal } from '@angular/core';
import { Reservation } from '@core/models/reservation';
import { PublicMessageComponent } from "../public-message/public-message.component";
import { HttpErrorResponse } from '@angular/common/http';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { PublicReservationsService } from '@core/services/http/public-reservations.service';
import { LocalStorageService } from '@core/services/local-storage.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiDestroyService, tuiPure } from '@taiga-ui/cdk';
import { takeUntil, finalize } from 'rxjs';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TuiButtonModule, TuiLinkModule, TuiLoaderModule } from '@taiga-ui/core';
import { ContactUsComponent } from '../contact-us/contact-us.component';
import { TermsAndConditionsLinkComponent } from "../terms-and-conditions-link/terms-and-conditions-link.component";

@Component({
  selector: 'app-public-reservation-confirmation',
  standalone: true,
  imports: [
    DatePipe,
    TuiButtonModule,
    PublicMessageComponent,
    RouterLink,
    TuiLinkModule,
    ContactUsComponent,
    TuiLoaderModule,
    CurrencyPipe,
    TermsAndConditionsLinkComponent
],
  templateUrl: './public-reservation-confirmation.component.html',
  styleUrl: './public-reservation-confirmation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicReservationConfirmationComponent {
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly reservations: PublicReservationsService = inject(PublicReservationsService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly localStorage: LocalStorageService = inject(LocalStorageService);

  readonly resendingConfirmation: WritableSignal<boolean> = signal(false);

  @Input({required: true}) reservation?: Reservation | null;

  /**
   * When true, on the bottom of the page a link for the details page will be shown.
   * Should always be true except when the location of the component is already the details page.
   */
  @Input({required: true}) shareDetailsLinkShown: boolean = true;

  // @tuiPure
  isFreshReservation(): boolean {
    if (!(this.reservation && this.reservation.created_at)) {
      console.warn("isFreshReservation", "missing reservation or created_at", this.reservation);
      return false;
    }

    return Date.now() - this.reservation.created_at.getTime() < 5 * 60 * 1000;
  }

  resendConfirmation(): void {
    const secret: string | undefined = this.reservation?.secret;
    if (!secret) return;

    this.resendingConfirmation.set(true);
    this.reservations.resendConfirmation(secret).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.resendingConfirmation.set(false)),
    ).subscribe({
      next: (): void => {
        this.notifications.fireSnackBar($localize`L'email arriverà a breve.`);
      },
      error: (e: unknown) => {
        this.notifications.error(e instanceof HttpErrorResponse ? parseHttpErrorMessage(e) : SOMETHING_WENT_WRONG_MESSAGE);
      }
    });
  }
}
