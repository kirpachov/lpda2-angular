import { Component, Input } from '@angular/core';
import { ReservationPaymentPreorderType } from '@core/lib/interfaces/reservation-payment-data';

@Component({
  selector: 'app-reservation-payment-preorder-type',
  standalone: true,
  imports: [],
  templateUrl: './reservation-payment-preorder-type.component.html',
})
export class ReservationPaymentPreorderTypeComponent {
  @Input({required: true}) value?: ReservationPaymentPreorderType;
}
