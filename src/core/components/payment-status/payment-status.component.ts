import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReservationPaymentStatus } from '@core/lib/interfaces/reservation-payment-data';
import { PaymentStatusColorPipe } from "../../pipes/payment-status-color.pipe";

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [PaymentStatusColorPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <span class="{{ status | paymentStatusColor }}">
    @switch(status){
      @case("paid"){
        <ng-container i18n>Pagata</ng-container>
      }
      @case("authorized") {
        <ng-container i18n>Autorizzata</ng-container>
      }
      @case("todo") {
        <ng-container i18n>Non pagata</ng-container>
      }
      @case("refunded") {
        <ng-container i18n>Rimborsata</ng-container>
      }
      @default{
        {{ status }}
      }
    }
  </span>
  `,
})
export class PaymentStatusComponent {
  @Input({required: true}) status: ReservationPaymentStatus | null | undefined = null;
}
