import {ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {TuiDestroyService} from "@taiga-ui/cdk";
import {ActivatedRoute, Params, Router, RouterLink} from "@angular/router";
import {PublicReservationsService} from "@core/services/http/public-reservations.service";
import {NotificationsService} from "@core/services/notifications.service";
import {Reservation} from "@core/models/reservation";
import {distinctUntilChanged, finalize, map, takeUntil, tap} from "rxjs";
import {filter, switchMap} from "rxjs/operators";
import {HttpErrorResponse} from "@angular/common/http";
import {ContactUsComponent} from "@core/components/contact-us/contact-us.component";
import {TuiButtonModule, TuiLoaderModule} from "@taiga-ui/core";
import {PublicMessageComponent} from "@core/components/public-message/public-message.component";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {SOMETHING_WENT_WRONG_MESSAGE} from "@core/lib/something-went-wrong-message";
import {DatePipe} from "@angular/common";
import { Title } from '@angular/platform-browser';
import { PublicPageComponent } from '../public-page-component';

@Component({
  selector: 'app-cancel-reservation',
  standalone: true,
  imports: [
    ContactUsComponent,
    TuiLoaderModule,
    PublicMessageComponent,
    TuiButtonModule,
    DatePipe,
    RouterLink
  ],
  templateUrl: './cancel-reservation.component.html',
  styleUrl: './cancel-reservation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class CancelReservationComponent extends PublicPageComponent implements OnInit {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);
  private readonly reservations: PublicReservationsService = inject(PublicReservationsService);
  private readonly notifications: NotificationsService = inject(NotificationsService);

  readonly reservation: WritableSignal<Reservation | null> = signal<Reservation | null>(null);
  readonly loading: WritableSignal<boolean> = signal<boolean>(true);

  private secret: string | null = null;

  readonly _ = inject(Title).setTitle($localize`Elimina prenotazione | La Porta D'Acqua`);

  override ngOnInit(): void {
    super.ngOnInit();

    this.route.params.pipe(
      takeUntil(this.destroy$),
      map((params: Params) => params["secret"]),
      filter((secret: unknown): secret is string => typeof secret === "string" && secret.length > 0),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      tap((secret: string) => this.secret = secret),
      switchMap((secret: string) => this.reservations.load(secret)),
    ).subscribe({
      next: (r: Reservation) => {
        this.loading.set(false);
        this.reservation.set(r);
      },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.reservation.set(null);
      }
    })
  }

  cancelReservation(): void {
    if (!this.secret) {
      this.notifications.error(SOMETHING_WENT_WRONG_MESSAGE);
      return;
    }

    this.loading.set(true);
    this.reservations.cancel(this.secret).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false)),
    ).subscribe({
        next: (): void => {
          this.reservations.created.next(null);
          this.notifications.fireSnackBar($localize`Prenotazione cancellata.`);
          this.router.navigate(["/"]);
        },
        error: (e: unknown) => {
          this.notifications.error(e instanceof HttpErrorResponse ? parseHttpErrorMessage(e) : SOMETHING_WENT_WRONG_MESSAGE);
        }
      }
    );
  }
}
