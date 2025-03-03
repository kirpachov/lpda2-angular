import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { PublicReservationConfirmationComponent } from "../../../core/components/public-reservation-confirmation/public-reservation-confirmation.component";
import { ActivatedRoute, Params, Router, Scroll } from '@angular/router';
import { PublicReservationsService } from '@core/services/http/public-reservations.service';
import { Reservation } from '@core/models/reservation';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { filter, finalize, takeUntil } from 'rxjs';
import { TuiLoaderModule } from '@taiga-ui/core';
import { JsonPipe, ViewportScroller } from '@angular/common';
import { PublicPageComponent } from '../public-page-component';

@Component({
  selector: 'app-view-reservation',
  standalone: true,
  imports: [
    PublicReservationConfirmationComponent,
    TuiLoaderModule,
    // JsonPipe
  ],
  templateUrl: './view-reservation.component.html',
  styleUrl: './view-reservation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class ViewReservationComponent extends PublicPageComponent implements OnInit {
  private readonly destroy$ = inject(TuiDestroyService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  private readonly reservations = inject(PublicReservationsService);

  readonly loading: WritableSignal<boolean> = signal(true);
  readonly reservation: WritableSignal<Reservation | null> = signal(null);

  override ngOnInit(): void {
    super.ngOnInit();

    this.route.params.subscribe({
      next: (p: Params) => {
        const secret = p["secret"];
        if (typeof secret === "string" && secret.length > 0) this.loadReservation(secret);
      }
    })
  }

  private loadReservation(secret: string) {
    this.reservation.set(null);
    this.reservations.load(secret).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (p: Reservation) => {
        this.reservation.set(p);
      }
    })
  }
}
