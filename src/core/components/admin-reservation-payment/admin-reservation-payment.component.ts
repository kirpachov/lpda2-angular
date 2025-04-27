import { CurrencyPipe, DatePipe, JsonPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input, Output, Signal, signal, WritableSignal, EventEmitter } from '@angular/core';
import { Reservation } from '@core/models/reservation';
import { ReservationPayment } from '@core/models/reservation-payment';
import { TuiButtonModule, TuiDialogService, TuiHintModule, TuiLinkModule } from '@taiga-ui/core';
import { TuiDialogContext } from '@taiga-ui/core';
import { PolymorpheusContent } from '@tinkoff/ng-polymorpheus';
import { CopyContentComponent } from "../copy-content/copy-content.component";
import { ReservationPaymentStatus } from '@core/lib/interfaces/reservation-payment-data';
import { ReservationsService } from '@core/services/http/reservations.service';
import { NotificationsService } from '@core/services/notifications.service';
import { takeUntil, finalize, switchMap, Observable } from 'rxjs';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { HttpErrorResponse } from '@angular/common/http';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TuiInputModule, TuiInputNumberModule, TuiSelectModule } from '@taiga-ui/kit';
import { TuiTextfieldControllerModule } from '@taiga-ui/core';
import { ErrorsComponent } from "@core/components/errors/errors.component";
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { ReservationPeopleComponent } from "@core/components/reservation-people/reservation-people.component";
import {TuiDataListModule} from '@taiga-ui/core';
import {TuiDataListWrapperModule} from '@taiga-ui/kit';
import { PreorderReservationGroupPreorderTypeComponent } from "../preorder-reservation-group-preorder-type/preorder-reservation-group-preorder-type.component";
import { ReservationPaymentPreorderTypeComponent } from "../reservation-payment-preorder-type/reservation-payment-preorder-type.component";
import { PaymentStatusColorPipe } from "../../pipes/payment-status-color.pipe";
import { PaymentStatusComponent } from "../payment-status/payment-status.component";

@Component({
  selector: 'app-admin-reservation-payment',
  standalone: true,
  imports: [
    TuiButtonModule,
    CopyContentComponent,
    TuiLinkModule,
    CurrencyPipe,
    NgTemplateOutlet,
    MatIconModule,
    TuiHintModule,
    DatePipe,
    ReactiveFormsModule,
    TuiInputModule,
    TuiInputNumberModule,
    TuiTextfieldControllerModule,
    TuiAutoFocusModule,
    ErrorsComponent,
    ReservationPeopleComponent,
    TuiSelectModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    PreorderReservationGroupPreorderTypeComponent,
    ReservationPaymentPreorderTypeComponent,
    PaymentStatusColorPipe,
    PaymentStatusComponent
],
  templateUrl: './admin-reservation-payment.component.html',
  styleUrl: './admin-reservation-payment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class AdminReservationPaymentComponent {
  private readonly destroy = inject(TuiDestroyService);
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);
  private readonly reservations: ReservationsService = inject(ReservationsService);
  private readonly notifications: NotificationsService = inject(NotificationsService);

  @Output() reservationChange: EventEmitter<Reservation> = new EventEmitter<Reservation>();

  readonly reservation: WritableSignal<Reservation | null> = signal(null);
  readonly payment: WritableSignal<ReservationPayment | null> = signal(null);
  readonly status: Signal<ReservationPaymentStatus | null> = computed(() => this.payment()?.status || null);

  readonly loading: WritableSignal<boolean> = signal(false);

  readonly newPaymentForm: FormGroup<{
    amount: FormControl<null | number>,
    deferred: FormControl<null | boolean>,
  }> = new FormGroup({
    amount: new FormControl<null | number>(null, [Validators.required]),
    deferred: new FormControl<null | boolean>(null, [Validators.required]),
  });

  @Input({ required: true, alias: 'reservation' }) set reservationValue(value: Reservation | null) {
    this.reservation.set(value);
    this.payment.set(value?.payment || null);
  }

  createPayment(obs: { complete: () => unknown }): void {
    const amount: number | null = this.newPaymentForm.controls.amount.value;
    const deferred: boolean | null = this.newPaymentForm.controls.deferred.value;
    const reservationId = this.reservation()?.id;

    if (
      !reservationId ||
      this.newPaymentForm.invalid ||
      !amount
    ) {
      this.notifications.fireSnackBar($localize`Verifica i dati inseriti e riprova.`);
      return;
    }

    this.reservations.createPayment(reservationId, {
      amount,
      deferred
    }).pipe(
      takeUntil(this.destroy)
    ).subscribe({
      next: (datum: Reservation) => {
        this.reservationValue = datum;
        this.reservationChange.emit(datum);
        this.notifications.fireSnackBar($localize`Pagamento creato.`);
        obs.complete();
      }
    });
  }

  showDialog(content: PolymorpheusContent<TuiDialogContext>): void {
    this.dialogs.open(content).subscribe();
  }

  fetchPaymentStatus(): void {
    const id = this.reservation()?.id;
    if (!(id)) {
      this.notifications.error();
      return;
    }

    this.loading.set(true);
    this.reservations.refreshPaymentStatus(id).pipe(
      takeUntil(this.destroy),
      finalize(() => this.loading.set(false)),
    ).subscribe((reservation: Reservation) => {
      this.reservationValue = reservation;
    }, (e: HttpErrorResponse) => {
      this.notifications.error(parseHttpErrorMessage(e));
    });
  }

  cancelPayment() {
    const id = this.reservation()?.id;
    if (!(id)) {
      this.notifications.error();
      return;
    }

    this.notifications.confirm($localize`I soldi della prenotazione verranno ritornati al cliente. Sei sicuro?`).subscribe({
      next: (confirmed: boolean) => {
        if (!confirmed) return;

        this.loading.set(true);
        this.reservations.refoundPayment(id).pipe(
          takeUntil(this.destroy),
          finalize(() => this.loading.set(false)),
        ).subscribe((reservation: Reservation) => {
          this.reservationValue = reservation;
        }, (e: HttpErrorResponse) => {
          this.notifications.error(parseHttpErrorMessage(e));
        });

      }
    })
  }

  confirmPayment() {
    const id = this.reservation()?.id;
    if (!(id)) {
      this.notifications.error();
      return;
    }

    this.notifications.confirm($localize`La transazione verrà confermata. Sei sicuro?`).subscribe({
      next: (confirmed: boolean) => {
        if (!confirmed) return;

        this.loading.set(true);
        this.reservations.confirmPayment(id).pipe(
          takeUntil(this.destroy),
          finalize(() => this.loading.set(false)),
        ).subscribe((reservation: Reservation) => {
          this.reservationValue = reservation;
        }, (e: HttpErrorResponse) => {
          this.notifications.error(parseHttpErrorMessage(e));
        });

      }
    })
  }
}
