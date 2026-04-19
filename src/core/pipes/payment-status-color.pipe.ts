import { Pipe, PipeTransform } from '@angular/core';
import { ReservationPaymentStatus } from '@core/lib/interfaces/reservation-payment-data';

@Pipe({
  name: 'paymentStatusColor',
  standalone: true,
  pure: true
})
export class PaymentStatusColorPipe implements PipeTransform {

  transform(value: ReservationPaymentStatus | null | undefined): string | null {
    switch (value) {
      case "todo": return "text-danger";
      case "authorized": return "text-success";
      case "paid": return "text-success-dark";
      case "refunded": return "text-warning";
      case "expired": return "text-secondary";
      default:
        return null;
    }
  }
}
